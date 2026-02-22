package at.htlleonding.wtw.wearables.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.InternalServerErrorException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.hc.client5.http.classic.methods.HttpGet;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.classic.methods.HttpPut;
import org.apache.hc.client5.http.classic.methods.HttpUriRequestBase;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.entity.mime.MultipartEntityBuilder;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.http.HttpEntity;
import org.apache.hc.core5.http.HttpHeaders;
import org.apache.hc.core5.http.io.entity.ByteArrayEntity;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.apache.hc.core5.util.Timeout;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.net.URI;
import java.nio.file.Files;
import java.util.Locale;

@ApplicationScoped
public class WearableAiProxyService {

    private final CloseableHttpClient httpClient;
    private final String pythonBaseUrl;

    public WearableAiProxyService(
            @ConfigProperty(name = "app.python.base-url", defaultValue = "http://wtw-python:8000")
            String pythonBaseUrl
    ) {
        this.pythonBaseUrl = trimTrailingSlash(pythonBaseUrl);
        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectionRequestTimeout(Timeout.ofSeconds(5))
                .setConnectTimeout(Timeout.ofSeconds(5))
                .setResponseTimeout(Timeout.ofSeconds(120))
                .build();
        this.httpClient = HttpClients.custom()
                .setDefaultRequestConfig(requestConfig)
                .build();
    }

    public Response get(String path) {
        HttpGet request = new HttpGet(resolve(path));
        request.setHeader(HttpHeaders.ACCEPT, "*/*");
        return execute(request);
    }

    public Response postJson(String path, String jsonBody) {
        HttpPost request = new HttpPost(resolve(path));
        request.setHeader(HttpHeaders.ACCEPT, "*/*");
        request.setEntity(new StringEntity(jsonBody == null ? "{}" : jsonBody, ContentType.APPLICATION_JSON));
        return execute(request);
    }

    public Response putJson(String path, String jsonBody) {
        HttpPut request = new HttpPut(resolve(path));
        request.setHeader(HttpHeaders.ACCEPT, "*/*");
        request.setEntity(new StringEntity(jsonBody == null ? "{}" : jsonBody, ContentType.APPLICATION_JSON));
        return execute(request);
    }

    public Response deleteJson(String path, String jsonBody) {
        HttpUriRequestBase request = new HttpUriRequestBase("DELETE", URI.create(resolve(path)));
        request.setHeader(HttpHeaders.ACCEPT, "*/*");
        request.setEntity(new StringEntity(jsonBody == null ? "{}" : jsonBody, ContentType.APPLICATION_JSON));
        return execute(request);
    }

    public Response postMultipart(String path, MultipartEntityBuilder multipartBuilder) {
        HttpPost request = new HttpPost(resolve(path));
        request.setHeader(HttpHeaders.ACCEPT, "*/*");
        request.setEntity(multipartBuilder.build());
        return execute(request);
    }

    public Response postRaw(String path, String contentType, byte[] body) {
        HttpPost request = new HttpPost(resolve(path));
        request.setHeader(HttpHeaders.ACCEPT, "*/*");
        ContentType requestContentType = parseContentType(contentType);
        request.setEntity(new ByteArrayEntity(body == null ? new byte[0] : body, requestContentType));
        return execute(request);
    }

    public void addImagePart(MultipartEntityBuilder builder, String fieldName, FileUpload fileUpload) {
        String contentType = normalizeContentType(fileUpload.contentType(), fileUpload.fileName());
        builder.addBinaryBody(
                fieldName,
                fileUpload.uploadedFile().toFile(),
                ContentType.parse(contentType),
                sanitizeFileName(fileUpload.fileName())
        );
    }

    public void validateImageUpload(FileUpload fileUpload, String fieldName) {
        if (fileUpload == null) {
            throw new jakarta.ws.rs.BadRequestException(fieldName + " is required");
        }
        if (fileUpload.uploadedFile() == null || !Files.exists(fileUpload.uploadedFile())) {
            throw new jakarta.ws.rs.BadRequestException("uploaded file is missing");
        }
        String contentType = normalizeContentType(fileUpload.contentType(), fileUpload.fileName());
        if (!contentType.startsWith("image/")) {
            throw new jakarta.ws.rs.BadRequestException(fieldName + " must be an image");
        }
    }

    private Response execute(HttpUriRequestBase request) {
        try (CloseableHttpResponse response = httpClient.execute(request)) {
            int status = response.getCode();
            HttpEntity entity = response.getEntity();
            byte[] body = entity != null ? entity.getContent().readAllBytes() : new byte[0];
            String responseContentType = entity != null && entity.getContentType() != null
                    ? entity.getContentType()
                    : MediaType.APPLICATION_JSON;

            Response.ResponseBuilder builder = Response.status(status)
                    .header(HttpHeaders.CONTENT_TYPE, responseContentType);

            var disposition = response.getFirstHeader("Content-Disposition");
            if (disposition != null && disposition.getValue() != null && !disposition.getValue().isBlank()) {
                builder.header("Content-Disposition", disposition.getValue());
            }

            if (body.length == 0) {
                return builder.build();
            }
            return builder.entity(body).build();
        } catch (WebApplicationException e) {
            throw e;
        } catch (IOException e) {
            throw new InternalServerErrorException("Failed to call Python service", e);
        } catch (Exception e) {
            throw new WebApplicationException(
                    Response.status(Response.Status.SERVICE_UNAVAILABLE)
                            .type(MediaType.TEXT_PLAIN)
                            .entity("Python service unavailable")
                            .build()
            );
        }
    }

    private String resolve(String path) {
        if (path == null || path.isBlank()) {
            return pythonBaseUrl;
        }
        if (path.startsWith("/")) {
            return pythonBaseUrl + path;
        }
        return pythonBaseUrl + "/" + path;
    }

    private static ContentType parseContentType(String value) {
        if (value == null || value.isBlank()) {
            return ContentType.APPLICATION_OCTET_STREAM;
        }
        try {
            return ContentType.parse(value);
        } catch (Exception e) {
            return ContentType.APPLICATION_OCTET_STREAM;
        }
    }

    private static String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "http://wtw-python:8000";
        }
        String result = value.trim();
        while (result.endsWith("/")) {
            result = result.substring(0, result.length() - 1);
        }
        return result;
    }

    private static String normalizeContentType(String contentType, String fileName) {
        if (contentType != null && !contentType.isBlank()) {
            return contentType.trim().toLowerCase(Locale.ROOT);
        }
        String lower = (fileName == null) ? "" : fileName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".webp")) return "image/webp";
        if (lower.endsWith(".jpeg") || lower.endsWith(".jpg")) return "image/jpeg";
        return "application/octet-stream";
    }

    private static String sanitizeFileName(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "upload.jpg";
        }
        String normalized = fileName.replace("\\", "/");
        int idx = normalized.lastIndexOf('/');
        String baseName = (idx >= 0) ? normalized.substring(idx + 1) : normalized;
        String clean = baseName.replaceAll("[^a-zA-Z0-9._-]", "_");
        return clean.isBlank() ? "upload.jpg" : clean;
    }
}

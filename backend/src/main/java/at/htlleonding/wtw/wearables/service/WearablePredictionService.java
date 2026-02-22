package at.htlleonding.wtw.wearables.service;

import at.htlleonding.wtw.wearables.dto.WearablePredictResponseDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.InternalServerErrorException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.config.RequestConfig;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.CloseableHttpResponse;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.client5.http.entity.mime.MultipartEntityBuilder;
import org.apache.hc.core5.http.ContentType;
import org.apache.hc.core5.util.Timeout;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.net.SocketTimeoutException;
import java.net.UnknownHostException;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class WearablePredictionService {

    private final ObjectMapper objectMapper;
    private final CloseableHttpClient httpClient;
    private final String predictUrl;

    public WearablePredictionService(
            ObjectMapper objectMapper,
            @ConfigProperty(name = "app.python.predict-url", defaultValue = "http://wtw-python:8000/wearables/predict")
            String predictUrl
    ) {
        this.objectMapper = objectMapper;
        this.predictUrl = predictUrl;
        RequestConfig requestConfig = RequestConfig.custom()
                .setConnectionRequestTimeout(Timeout.ofSeconds(5))
                .setConnectTimeout(Timeout.ofSeconds(5))
                .setResponseTimeout(Timeout.ofSeconds(60))
                .build();
        this.httpClient = HttpClients.custom()
                .setDefaultRequestConfig(requestConfig)
                .build();
    }

    public WearablePredictResponseDto predict(FileUpload fileUpload) {
        if (fileUpload == null) {
            throw new BadRequestException("file is required");
        }
        if (fileUpload.uploadedFile() == null || !Files.exists(fileUpload.uploadedFile())) {
            throw new BadRequestException("uploaded file is missing");
        }

        String contentType = normalizeContentType(fileUpload.contentType(), fileUpload.fileName());
        if (!contentType.startsWith("image/")) {
            throw new BadRequestException("file must be an image");
        }

        try {
            String fileName = sanitizeFileName(fileUpload.fileName());
            HttpPost request = new HttpPost(predictUrl);
            request.setHeader("Accept", MediaType.APPLICATION_JSON);
            request.setEntity(MultipartEntityBuilder.create()
                    .addBinaryBody(
                            "file",
                            fileUpload.uploadedFile().toFile(),
                            ContentType.parse(contentType),
                            fileName
                    )
                    .build());

            int status;
            String body;
            try (CloseableHttpResponse response = httpClient.execute(request)) {
                status = response.getCode();
                body = response.getEntity() != null
                        ? new String(response.getEntity().getContent().readAllBytes())
                        : "";
            }

            if (status < 200 || status >= 300) {
                if (status == 400 || status == 422 || status == 503) {
                    throw new WebApplicationException(
                            Response.status(status)
                                    .type(MediaType.TEXT_PLAIN)
                                    .entity(body == null ? "" : body)
                                    .build()
                    );
                }

                throw new WebApplicationException(
                        Response.status(Response.Status.BAD_GATEWAY)
                                .type(MediaType.TEXT_PLAIN)
                                .entity("Prediction service error (" + status + "): " + (body == null ? "" : body))
                                .build()
                );
            }

            JsonNode root = objectMapper.readTree(body);
            JsonNode categoryNode = root.get("category");
            JsonNode tagsNode = root.get("tags");
            JsonNode confidenceNode = root.get("confidence");

            if (categoryNode == null || !categoryNode.isTextual() || confidenceNode == null || !confidenceNode.isNumber()) {
                throw new WebApplicationException(
                        Response.status(Response.Status.BAD_GATEWAY)
                                .type(MediaType.TEXT_PLAIN)
                                .entity("Invalid prediction response from upstream service")
                                .build()
                );
            }

            List<String> tags = new ArrayList<>();
            if (tagsNode != null && tagsNode.isArray()) {
                for (JsonNode tagNode : tagsNode) {
                    if (tagNode != null && tagNode.isTextual()) {
                        tags.add(tagNode.asText());
                    }
                }
            }

            return new WearablePredictResponseDto(
                    categoryNode.asText(),
                    tags,
                    confidenceNode.asDouble()
            );
        } catch (WebApplicationException e) {
            throw e;
        } catch (UnknownHostException | SocketTimeoutException e) {
            throw new WebApplicationException(
                    Response.status(Response.Status.SERVICE_UNAVAILABLE)
                            .type(MediaType.TEXT_PLAIN)
                            .entity("Prediction service unavailable")
                            .build()
            );
        } catch (IOException e) {
            throw new InternalServerErrorException("Failed to process prediction response", e);
        } catch (Exception e) {
            throw new WebApplicationException(
                    Response.status(Response.Status.SERVICE_UNAVAILABLE)
                            .type(MediaType.TEXT_PLAIN)
                            .entity("Prediction service unavailable")
                            .build()
            );
        }
    }

    private static String normalizeContentType(String contentType, String fileName) {
        if (contentType != null && !contentType.isBlank()) {
            return contentType.trim().toLowerCase();
        }
        String lower = (fileName == null) ? "" : fileName.toLowerCase();
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

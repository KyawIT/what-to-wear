package at.htlleonding.wtw.wearables.dto;

import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

public class WearablePredictRequestDto {
    @RestForm("file")
    public FileUpload file;
}

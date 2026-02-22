package at.htlleonding.wtw.wearables.dto;

import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

public class WearableAiOutfitAiRequestDto {
    @RestForm("image")
    public FileUpload image;

    @RestForm("user_id")
    public String userId;
}

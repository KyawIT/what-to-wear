package at.htlleonding.wtw.wearables.dto;

import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

public class WearableAiWearableUploadRequestDto {
    @RestForm("file")
    public FileUpload file;

    @RestForm("category")
    public String category;

    @RestForm("tags")
    public String tags;

    @RestForm("item_id")
    public String itemId;

    @RestForm("user_id")
    public String userId;
}

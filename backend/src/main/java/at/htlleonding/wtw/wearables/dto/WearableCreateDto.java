package at.htlleonding.wtw.wearables.dto;

import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

public class WearableCreateDto {

    @RestForm("categoryId")
    public String categoryId;

    @RestForm("title")
    public String title;

    @RestForm("description")
    public String description;

    // comma separated: "black,streetwear"
    @RestForm("tags")
    public String tags;

    @RestForm("file")
    public FileUpload file;
}

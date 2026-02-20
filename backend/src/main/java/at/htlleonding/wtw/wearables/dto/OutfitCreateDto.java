package at.htlleonding.wtw.wearables.dto;

import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

public class OutfitCreateDto {

    @RestForm("title")
    public String title;

    @RestForm("description")
    public String description;

    // comma separated: "casual,summer"
    @RestForm("tags")
    public String tags;

    // comma separated UUIDs: "uuid1,uuid2,uuid3"
    @RestForm("wearableIds")
    public String wearableIds;

    @RestForm("file")
    public FileUpload file;
}

package com.example.parkspot.dto;

public class FlatResponse {

    private Long id;
    private String flatNumber;
    private String residentName;

    public FlatResponse() {
    }

    public FlatResponse(Long id, String flatNumber, String residentName) {
        this.id = id;
        this.flatNumber = flatNumber;
        this.residentName = residentName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFlatNumber() {
        return flatNumber;
    }

    public void setFlatNumber(String flatNumber) {
        this.flatNumber = flatNumber;
    }

    public String getResidentName() {
        return residentName;
    }

    public void setResidentName(String residentName) {
        this.residentName = residentName;
    }
}

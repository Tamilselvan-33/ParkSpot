package com.example.parkspot.dto;

import jakarta.validation.constraints.NotBlank;

public class FlatRequest {

    @NotBlank(message = "Flat number cannot be blank")
    private String flatNumber;

    @NotBlank(message = "Resident name cannot be blank")
    private String residentName;

    public FlatRequest() {
    }

    public FlatRequest(String flatNumber, String residentName) {
        this.flatNumber = flatNumber;
        this.residentName = residentName;
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

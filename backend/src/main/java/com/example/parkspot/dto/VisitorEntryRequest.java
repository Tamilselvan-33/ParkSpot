package com.example.parkspot.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class VisitorEntryRequest {

    @NotBlank(message = "Vehicle number cannot be blank")
    private String vehicleNumber;

    @NotNull(message = "Flat ID is required")
    @Positive(message = "Flat ID must be a positive number")
    private Long flatId;

    @NotNull(message = "Parking slot ID is required")
    @Positive(message = "Parking slot ID must be a positive number")
    private Long slotId;

    public VisitorEntryRequest() {
    }

    public VisitorEntryRequest(String vehicleNumber, Long flatId, Long slotId) {
        this.vehicleNumber = vehicleNumber;
        this.flatId = flatId;
        this.slotId = slotId;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public Long getFlatId() {
        return flatId;
    }

    public void setFlatId(Long flatId) {
        this.flatId = flatId;
    }

    public Long getSlotId() {
        return slotId;
    }

    public void setSlotId(Long slotId) {
        this.slotId = slotId;
    }
}

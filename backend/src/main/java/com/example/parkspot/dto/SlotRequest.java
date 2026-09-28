package com.example.parkspot.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class SlotRequest {

    @NotNull(message = "Slot number is required")
    @Positive(message = "Slot number must be a positive integer")
    private Integer slotNumber;

    public SlotRequest() {
    }

    public SlotRequest(Integer slotNumber) {
        this.slotNumber = slotNumber;
    }

    public Integer getSlotNumber() {
        return slotNumber;
    }

    public void setSlotNumber(Integer slotNumber) {
        this.slotNumber = slotNumber;
    }
}

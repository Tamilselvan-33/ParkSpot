package com.example.parkspot.dto;

import java.time.LocalDateTime;

public class SlotStatusResponse {

    private Long id;
    private Integer slotNumber;
    private String status; // "FREE" or "OCCUPIED"
    private Long visitorId;
    private String vehicleNumber;
    private String flatNumber;
    private LocalDateTime entryTime;

    public SlotStatusResponse() {
    }

    public SlotStatusResponse(Long id, Integer slotNumber, String status) {
        this.id = id;
        this.slotNumber = slotNumber;
        this.status = status;
    }

    public SlotStatusResponse(Long id, Integer slotNumber, String status, Long visitorId,
                              String vehicleNumber, String flatNumber, LocalDateTime entryTime) {
        this.id = id;
        this.slotNumber = slotNumber;
        this.status = status;
        this.visitorId = visitorId;
        this.vehicleNumber = vehicleNumber;
        this.flatNumber = flatNumber;
        this.entryTime = entryTime;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getSlotNumber() {
        return slotNumber;
    }

    public void setSlotNumber(Integer slotNumber) {
        this.slotNumber = slotNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Long getVisitorId() {
        return visitorId;
    }

    public void setVisitorId(Long visitorId) {
        this.visitorId = visitorId;
    }

    public String getVehicleNumber() {
        return vehicleNumber;
    }

    public void setVehicleNumber(String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public String getFlatNumber() {
        return flatNumber;
    }

    public void setFlatNumber(String flatNumber) {
        this.flatNumber = flatNumber;
    }

    public LocalDateTime getEntryTime() {
        return entryTime;
    }

    public void setEntryTime(LocalDateTime entryTime) {
        this.entryTime = entryTime;
    }
}

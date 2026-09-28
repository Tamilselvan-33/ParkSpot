package com.example.parkspot.dto;

import java.time.LocalDateTime;

public class VisitorResponse {

    private Long id;
    private String vehicleNumber;
    private Long flatId;
    private String flatNumber;
    private String residentName;
    private Long slotId;
    private Integer slotNumber;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private String status; // "PARKED" or "EXITED"

    public VisitorResponse() {
    }

    public VisitorResponse(Long id, String vehicleNumber, Long flatId, String flatNumber, String residentName,
                           Long slotId, Integer slotNumber, LocalDateTime entryTime, LocalDateTime exitTime) {
        this.id = id;
        this.vehicleNumber = vehicleNumber;
        this.flatId = flatId;
        this.flatNumber = flatNumber;
        this.residentName = residentName;
        this.slotId = slotId;
        this.slotNumber = slotNumber;
        this.entryTime = entryTime;
        this.exitTime = exitTime;
        this.status = (exitTime == null) ? "PARKED" : "EXITED";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public Long getSlotId() {
        return slotId;
    }

    public void setSlotId(Long slotId) {
        this.slotId = slotId;
    }

    public Integer getSlotNumber() {
        return slotNumber;
    }

    public void setSlotNumber(Integer slotNumber) {
        this.slotNumber = slotNumber;
    }

    public LocalDateTime getEntryTime() {
        return entryTime;
    }

    public void setEntryTime(LocalDateTime entryTime) {
        this.entryTime = entryTime;
    }

    public LocalDateTime getExitTime() {
        return exitTime;
    }

    public void setExitTime(LocalDateTime exitTime) {
        this.exitTime = exitTime;
        this.status = (exitTime == null) ? "PARKED" : "EXITED";
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

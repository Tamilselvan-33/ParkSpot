package com.example.parkspot.dto;

import java.time.LocalDate;
import java.util.List;

public class DailyReportResponse {

    private LocalDate date;
    private int totalVisitors;
    private int currentlyParked;
    private int completedVisits;
    private List<VisitorResponse> visitors;

    public DailyReportResponse() {
    }

    public DailyReportResponse(LocalDate date, int totalVisitors, int currentlyParked,
                               int completedVisits, List<VisitorResponse> visitors) {
        this.date = date;
        this.totalVisitors = totalVisitors;
        this.currentlyParked = currentlyParked;
        this.completedVisits = completedVisits;
        this.visitors = visitors;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public int getTotalVisitors() {
        return totalVisitors;
    }

    public void setTotalVisitors(int totalVisitors) {
        this.totalVisitors = totalVisitors;
    }

    public int getCurrentlyParked() {
        return currentlyParked;
    }

    public void setCurrentlyParked(int currentlyParked) {
        this.currentlyParked = currentlyParked;
    }

    public int getCompletedVisits() {
        return completedVisits;
    }

    public void setCompletedVisits(int completedVisits) {
        this.completedVisits = completedVisits;
    }

    public List<VisitorResponse> getVisitors() {
        return visitors;
    }

    public void setVisitors(List<VisitorResponse> visitors) {
        this.visitors = visitors;
    }
}

package com.example.parkspot.service;

import com.example.parkspot.dto.DailyReportResponse;
import com.example.parkspot.dto.VisitorResponse;
import com.example.parkspot.entity.VisitorVehicle;
import com.example.parkspot.repository.VisitorVehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final VisitorVehicleRepository visitorVehicleRepository;

    public ReportService(VisitorVehicleRepository visitorVehicleRepository) {
        this.visitorVehicleRepository = visitorVehicleRepository;
    }

    @Transactional(readOnly = true)
    public DailyReportResponse getDailyReport(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(LocalTime.MAX);

        List<VisitorVehicle> records = visitorVehicleRepository.findByEntryTimeBetweenOrderByEntryTimeDesc(startOfDay, endOfDay);

        List<VisitorResponse> visitorResponses = records.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        int total = visitorResponses.size();
        int currentlyParked = (int) visitorResponses.stream().filter(v -> "PARKED".equals(v.getStatus())).count();
        int completed = total - currentlyParked;

        return new DailyReportResponse(date, total, currentlyParked, completed, visitorResponses);
    }

    @Transactional(readOnly = true)
    public List<VisitorResponse> getDateRangeReport(LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.atTime(LocalTime.MAX);

        return visitorVehicleRepository.findByEntryTimeBetweenOrderByEntryTimeDesc(start, end)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private VisitorResponse mapToResponse(VisitorVehicle visit) {
        return new VisitorResponse(
                visit.getId(),
                visit.getVehicleNumber(),
                visit.getFlat().getId(),
                visit.getFlat().getFlatNumber(),
                visit.getFlat().getResidentName(),
                visit.getParkingSlot().getId(),
                visit.getParkingSlot().getSlotNumber(),
                visit.getEntryTime(),
                visit.getExitTime()
        );
    }
}

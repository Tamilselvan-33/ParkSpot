package com.example.parkspot.exception;

public class SlotOccupiedException extends RuntimeException {
    public SlotOccupiedException(String message) {
        super(message);
    }
}

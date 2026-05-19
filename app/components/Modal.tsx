"use client";
import { useEffect } from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className = "modal-overlay" onClick = {onClose}>
            <div className = "modal-content" onClick = {(e) => e.stopPropagation()}>
                <div className = "modal-header">
                    <h2>{title}</h2>
                    <button 
                        className = "modal-close"
                        onClick = {onClose}
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

import React, { useEffect, useRef, ReactNode } from 'react';
import { X } from 'lucide-react';
import '../../styles/mobile-modal.css';

interface MobileModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Mobile-first modal component with proper iOS PWA scroll handling.
 * Uses JavaScript to manage scroll locking and touch events.
 */
const MobileModal: React.FC<MobileModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md'
}) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    // Lock body scroll when modal opens
    useEffect(() => {
        if (isOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;

            // Lock body
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
            document.body.style.overflow = 'hidden';

            return () => {
                // Restore scroll position
                document.body.style.position = '';
                document.body.style.top = '';
                document.body.style.width = '';
                document.body.style.overflow = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [isOpen]);

    // Handle touch move for iOS
    useEffect(() => {
        if (!isOpen || !contentRef.current) return;

        const content = contentRef.current;

        const handleTouchMove = (e: TouchEvent) => {
            // Allow scroll inside the modal content
            const target = e.target as HTMLElement;
            if (content.contains(target)) {
                // Check if we're at scroll boundaries
                const isAtTop = content.scrollTop <= 0;
                const isAtBottom = content.scrollTop + content.clientHeight >= content.scrollHeight;

                // Get touch direction
                const touch = e.touches[0];
                const startY = (content as any)._touchStartY || 0;
                const deltaY = touch.clientY - startY;

                // Prevent overscroll at boundaries
                if ((isAtTop && deltaY > 0) || (isAtBottom && deltaY < 0)) {
                    e.preventDefault();
                }
            } else {
                // Prevent scroll outside modal content
                e.preventDefault();
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            (content as any)._touchStartY = e.touches[0].clientY;
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="mobile-modal-overlay"
            onClick={onClose}
            ref={modalRef}
        >
            <div
                className={`mobile-modal-container mobile-modal-${size}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="mobile-modal-header">
                    <h2 className="mobile-modal-title">{title}</h2>
                    <button
                        type="button"
                        className="mobile-modal-close"
                        onClick={onClose}
                        aria-label="Fermer"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div
                    className="mobile-modal-content"
                    ref={contentRef}
                >
                    {children}
                </div>
            </div>
        </div>
    );
};

export default MobileModal;

/**
 * Simple toast notification helper
 * Alternative to Sonner library - uses native browser APIs
 */

type ToastType = "success" | "error" | "info";

interface ToastOptions {
  message: string;
  type: ToastType;
  duration?: number;
}

class ToastManager {
  private container: HTMLDivElement | null = null;

  private ensureContainer() {
    if (!this.container) {
      this.container = document.createElement("div");
      this.container.id = "toast-container";
      this.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(this.container);
    }
    return this.container;
  }

  private show({ message, type, duration = 3000 }: ToastOptions) {
    const container = this.ensureContainer();

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    // Styling based on type
    const colors = {
      success: "#10b981",
      error: "#ef4444",
      info: "#3b82f6",
    };

    toast.style.cssText = `
      background-color: ${colors[type]};
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      font-size: 14px;
      max-width: 300px;
      word-wrap: break-word;
      animation: slideIn 0.3s ease-out;
    `;

    toast.textContent = message;
    container.appendChild(toast);

    // Add slide-in animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
    `;
    if (!document.getElementById("toast-styles")) {
      style.id = "toast-styles";
      document.head.appendChild(style);
    }

    // Auto remove after duration
    setTimeout(() => {
      toast.style.animation = "slideOut 0.3s ease-out";
      setTimeout(() => {
        container.removeChild(toast);
        // Remove container if empty
        if (container.children.length === 0) {
          document.body.removeChild(container);
          this.container = null;
        }
      }, 300);
    }, duration);
  }

  success(message: string, duration?: number) {
    this.show({ message, type: "success", duration });
  }

  error(message: string, duration?: number) {
    this.show({ message, type: "error", duration });
  }

  info(message: string, duration?: number) {
    this.show({ message, type: "info", duration });
  }
}

// Export singleton instance
export const toast = new ToastManager();

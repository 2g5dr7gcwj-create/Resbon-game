class DeviceCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['device-name', 'device-type', 'status', 'player', 'time', 'price'];
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        this.render();
    }

    render() {
        const name = this.getAttribute('device-name') || 'جهاز';
        const type = this.getAttribute('device-type') || 'table';
        const status = this.getAttribute('status') || 'empty';
        const player = this.getAttribute('player') || '';
        const time = this.getAttribute('time') || '--:--';
        const price = this.getAttribute('price') || '0';

        const isActive = status === 'active';
        const isPaused = status === 'paused';
        const icon = type === 'table' ? 'grid' : 'monitor';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: 'Cairo', sans-serif;
                }
                .card {
                    background: rgba(26, 26, 26, 0.8);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(220, 38, 38, 0.3);
                    border-radius: 12px;
                    padding: 20px;
                    transition: all 0.3s ease;
                    position: relative;
                    overflow: hidden;
                }
                .card.active {
                    border-color: #dc2626;
                    box-shadow: 0 0 20px rgba(220, 38, 38, 0.3);
                }
                .card.paused {
                    border-color: #ca8a04;
                    opacity: 0.8;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: start;
                    margin-bottom: 16px;
                }
                .title {
                    color: white;
                    font-size: 18px;
                    font-weight: bold;
                    margin: 0 0 4px 0;
                }
                .status {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 14px;
                }
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #6b7280;
                }
                .status-dot.active {
                    background: #22c55e;
                    box-shadow: 0 0 8px #22c55e;
                    animation: blink 2s infinite;
                }
                .status-dot.paused {
                    background: #eab308;
                    box-shadow: 0 0 8px #eab308;
                }
                .icon-box {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #1a1a1a;
                    border: 1px solid rgba(220, 38, 38, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #dc2626;
                }
                .timer-box {
                    background: rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(42, 42, 42, 0.3);
                    border-radius: 8px;
                    padding: 12px;
                    text-align: center;
                    margin-bottom: 12px;
                }
                .timer {
                    font-family: 'Courier New', monospace;
                    font-size: 28px;
                    font-weight: bold;
                    color: #dc2626;
                    letter-spacing: 2px;
                }
                .timer.warning {
                    color: #ef4444;
                    animation: pulse 1s infinite;
                }
                .info {
                    margin-bottom: 12px;
                    font-size: 14px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                    color: #9ca3af;
                }
                .info-value {
                    color: white;
                    font-weight: bold;
                }
                .price {
                    color: #2563eb;
                    font-weight: bold;
                }
                button {
                    width: 100%;
                    padding: 10px;
                    border: none;
                    border-radius: 8px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-family: inherit;
                }
                .btn-primary {
                    background: #dc2626;
                    color: white;
                }
                .btn-primary:hover {
                    background: #b91c1c;
                    transform: scale(1.02);
                }
                .btn-manage {
                    background: #2563eb;
                    color: white;
                }
                .btn-manage:hover {
                    background: #1d4ed8;
                }
                .btn-paused {
                    background: #ca8a04;
                    color: white;
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            </style>
            
            <div class="card ${isActive ? 'active' : ''} ${isPaused ? 'paused' : ''}">
                <div class="header">
                    <div>
                        <h3 class="title">${name}</h3>
                        <div class="status">
                            <span class="status-dot ${status}"></span>
                            <span style="color: ${isActive ? '#22c55e' : isPaused ? '#eab308' : '#9ca3af'}">
                                ${isActive ? 'نشط' : isPaused ? 'متوقف' : 'متاح'}
                            </span>
                        </div>
                    </div>
                    <div class="icon-box">
                        <i data-feather="${icon}"></i>
                    </div>
                </div>
                
                <div class="timer-box">
                    <div class="timer ${time.includes('00:0') && isActive ? 'warning' : ''}">${time}</div>
                </div>
                
                ${player ? `
                <div class="info">
                    <div class="info-row">
                        <span>اللاعب:</span>
                        <span class="info-value">${player}</span>
                    </div>
                    <div class="info-row">
                        <span>السعر:</span>
                        <span class="price">${parseInt(price).toLocaleString()} د.ع</span>
                    </div>
                </div>
                ` : ''}
                
                <button class="${isActive ? 'btn-manage' : isPaused ? 'btn-paused' : 'btn-primary'}" onclick="this.getRootNode().host.handleClick()">
                    ${isActive ? 'إدارة الجلسة' : isPaused ? 'استئناف / إدارة' : 'حجز الآن'}
                </button>
            </div>
        `;
    }

    handleClick() {
        const event = new CustomEvent('device-action', {
            bubbles: true,
            composed: true,
            detail: {
                deviceId: this.getAttribute('device-id'),
                deviceType: this.getAttribute('device-type')
            }
        });
        this.dispatchEvent(event);
    }
}

customElements.define('device-card', DeviceCard);

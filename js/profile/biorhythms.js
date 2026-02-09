/**
 * Profile Biorhythms - Chart.js biorhythm visualization
 */

function initBiorhythms(birthDate) {
    const container = document.getElementById('biorhythm-container');
    if (!container || !birthDate) {
        if (container) container.style.display = 'none';
        return;
    }

    container.style.display = 'block';

    try {
        const birth = new Date(birthDate);
        const today = new Date();
        const daysSinceBirth = Math.floor((today - birth) / (1000 * 60 * 60 * 24));

        const labels = [];
        const physical = [];
        const emotional = [];
        const intellectual = [];

        for (let i = -15; i <= 15; i++) {
            const days = daysSinceBirth + i;
            if (i === 0) {
                labels.push('Dnes');
            } else {
                const date = new Date(today);
                date.setDate(date.getDate() + i);
                labels.push(`${date.getDate()}.${date.getMonth() + 1}.`);
            }

            physical.push(Math.sin(2 * Math.PI * days / 23) * 100);
            emotional.push(Math.sin(2 * Math.PI * days / 28) * 100);
            intellectual.push(Math.sin(2 * Math.PI * days / 33) * 100);
        }

        const canvas = document.getElementById('bio-canvas');
        const ctx = canvas.getContext('2d');

        if (window.biorhythmChart) {
            window.biorhythmChart.destroy();
        }

        window.biorhythmChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Fyzický',
                        data: physical,
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Emocionální',
                        data: emotional,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Intelektuální',
                        data: intellectual,
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#fff',
                            font: { size: 11 },
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#d4af37',
                        bodyColor: '#fff',
                        borderColor: 'rgba(212, 175, 55, 0.3)',
                        borderWidth: 1
                    }
                },
                scales: {
                    y: {
                        min: -100,
                        max: 100,
                        grid: { color: 'rgba(255, 255, 255, 0.1)', drawBorder: false },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            font: { size: 10 },
                            callback: function (value) {
                                if (value === 0) return '0';
                                if (value === 100) return '+100';
                                if (value === -100) return '-100';
                                return '';
                            }
                        }
                    },
                    x: {
                        grid: { color: 'rgba(255, 255, 255, 0.05)', drawBorder: false },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.6)',
                            font: { size: 9 },
                            maxRotation: 45,
                            minRotation: 0
                        }
                    }
                },
                interaction: { mode: 'nearest', axis: 'x', intersect: false }
            }
        });

        // Add summary text
        const summaryDiv = document.getElementById('bio-summary');
        if (summaryDiv) {
            const todayPhysical = physical[15];
            const todayEmotional = emotional[15];
            const todayIntellectual = intellectual[15];

            const getLevel = (value) => {
                if (value > 50) return 'Vysoká';
                if (value > 0) return 'Dobrá';
                if (value > -50) return 'Nízká';
                return 'Kritická';
            };

            summaryDiv.innerHTML = `
                <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(0,0,0,0.2); border-radius: 8px; font-size: 0.85rem;">
                    <p style="margin: 0.25rem 0; opacity: 0.8;"><strong>Dnes:</strong></p>
                    <p style="margin: 0.25rem 0;">Fyzicky: ${getLevel(todayPhysical)}</p>
                    <p style="margin: 0.25rem 0;">Emoce: ${getLevel(todayEmotional)}</p>
                    <p style="margin: 0.25rem 0;">Intelekt: ${getLevel(todayIntellectual)}</p>
                </div>
            `;
        }

    } catch (error) {
        console.error('Error initializing biorhythms:', error);
        container.innerHTML = `
            <p style="text-align: center; opacity: 0.6; padding: 2rem;">
                Nepodařilo se načíst biorytmy. Ujistěte se, že máte vyplněné datum narození.
            </p>
        `;
    }
}

// Expose to global scope
window.initBiorhythms = initBiorhythms;

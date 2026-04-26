        // Event delegation for reload button
        document.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');
            if (action === 'reloadPage') {
                window.location.reload();
            }
        });

        document.getElementById('stars')?.classList.add('stars--active');

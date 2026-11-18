const logoutButton = document.querySelector('#logout-button');
const logoutMessage = document.querySelector('#logout-message');

logoutButton.addEventListener('click', async() => {
    logoutButton.disabled = true;
    logoutButton.textContent = 'Logging out…';
    logoutMessage.textContent = '';

    try {
        const response = await fetch('/api/customers/logout', {
            method: 'POST',
            credentials: 'same-origin'
        });

        if (!response.ok) {
            throw new Error('Logout failed');
        }

        window.location.replace('/');
    } catch (error) {
        logoutMessage.dataset.state = 'error';
        logoutMessage.textContent =
            'Unable to log out. Please try again.';

        logoutButton.disabled = false;
        logoutButton.textContent = 'Log out';
    }
});
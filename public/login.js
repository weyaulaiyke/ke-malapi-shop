const form = document.querySelector('#login-form');
const message = document.querySelector('#login-message');
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async(event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
        return;
    }

    message.textContent = '';
    message.removeAttribute('data-state');

    submitButton.disabled = true;
    submitButton.textContent = 'Logging in…';

    try {
        const response = await fetch('/api/customers/login', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: form.elements.namedItem('email').value,
                password: form.elements.namedItem('password').value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            message.dataset.state = 'error';
            message.textContent = data.error || 'Unable to log in.';
            return;
        }

        form.reset();
        window.location.assign('/shop');
    } catch (error) {
        message.dataset.state = 'error';
        message.textContent =
            'We couldn’t complete login. Please check your connection and try again.';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Log in';
    }
});
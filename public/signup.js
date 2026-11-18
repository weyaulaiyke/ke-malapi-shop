const form = document.querySelector('.auth-form');
const message = document.querySelector('#signup-message');
const nextLink = document.querySelector('#signup-next');
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async(event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
        return;
    }

    message.textContent = '';
    message.removeAttribute('data-state');
    nextLink.hidden = true;

    submitButton.disabled = true;
    submitButton.textContent = 'Creating account…';

    try {
        const response = await fetch('/api/customers/signup', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: form.elements.namedItem('name').value,
                email: form.elements.namedItem('email').value,
                password: form.elements.namedItem('password').value
            })
        });

        const data = await response.json();

        if (!response.ok) {
            message.dataset.state = 'error';
            message.textContent = data.error || 'Unable to create account.';
            return;
        }

        form.reset();
        message.dataset.state = 'success';
        message.textContent = 'Your account is ready. Please log in to access the full collection.';
        nextLink.hidden = false;
    } catch (error) {
        message.dataset.state = 'error';
        message.textContent =
            'We couldn’t confirm account creation. Check your connection before trying again.';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Create account';
    }
});
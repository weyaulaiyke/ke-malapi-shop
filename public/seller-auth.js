const form = document.querySelector('#seller-auth-form');
const submitButton = document.querySelector('#seller-auth-submit');
const message = document.querySelector('#seller-auth-message');
const passwordInput = document.querySelector('#seller-password');
const passwordToggle = document.querySelector('#seller-password-toggle');

const mode = form.dataset.mode;
const buttonLabel = mode === 'setup' ?
    'Create seller account' :
    'Log in';

let submitting = false;

passwordToggle.addEventListener('click', () => {
    const showPassword = passwordInput.type === 'password';

    passwordInput.type = showPassword ? 'text' : 'password';
    passwordToggle.textContent = showPassword ? 'Hide' : 'Show';
    passwordToggle.setAttribute('aria-pressed', String(showPassword));
    passwordToggle.setAttribute(
        'aria-label',
        showPassword ? 'Hide password' : 'Show password'
    );
});

form.addEventListener('submit', async(event) => {
    event.preventDefault();

    if (submitting || !form.reportValidity()) {
        return;
    }

    const payload = {
        email: form.elements.namedItem('email').value,
        password: passwordInput.value
    };

    if (mode === 'setup') {
        payload.setupKey = form.elements.namedItem('setupKey').value;
    }

    submitting = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Please wait…';
    message.textContent = '';
    message.removeAttribute('data-state');

    try {
        const response = await fetch(`/api/seller/${mode}`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            message.dataset.state = 'error';
            message.textContent = data.error || 'Unable to continue.';
            return;
        }

        form.reset();
        window.location.assign('/seller');
    } catch (error) {
        message.dataset.state = 'error';
        message.textContent =
            'We couldn’t confirm the result. Check your connection. If setup may have completed, try logging in.';
    } finally {
        payload.password = '';
        delete payload.setupKey;

        submitting = false;
        submitButton.disabled = false;
        submitButton.textContent = buttonLabel;
    }
});
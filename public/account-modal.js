const dialog = document.querySelector('#account-dialog');
const form = document.querySelector('#account-form');
const title = document.querySelector('#account-title');
const description = document.querySelector('#account-description');
const nameField = document.querySelector('#account-name-field');
const nameInput = document.querySelector('#account-name');
const emailInput = document.querySelector('#account-email');
const passwordInput = document.querySelector('#account-password');
const passwordHelp = document.querySelector('#account-password-help');
const submitButton = document.querySelector('#account-submit');
const switchButton = document.querySelector('#account-switch');
const message = document.querySelector('#account-message');

let mode = 'login';
let submitting = false;

function setMode(nextMode) {
    mode = nextMode;
    const signup = mode === 'signup';

    title.textContent = signup ? 'A little more you.' : 'Welcome back.';
    description.textContent = signup ?
        'Create an account to explore the full collection.' :
        'Log in to explore the full collection.';

    nameField.hidden = !signup;
    nameInput.disabled = !signup;
    nameInput.required = signup;

    emailInput.autocomplete = signup ? 'email' : 'username';
    passwordInput.autocomplete = signup ?
        'new-password' :
        'current-password';

    passwordInput.value = '';
    passwordHelp.hidden = !signup;

    if (signup) {
        passwordInput.minLength = 12;
        passwordInput.setAttribute(
            'pattern',
            '(?=.*[A-Z])(?=.*[^A-Za-z0-9\\s]).{12,}'
        );
        passwordInput.title =
            'Use at least 12 characters, one uppercase letter and one special character.';
    } else {
        passwordInput.removeAttribute('minlength');
        passwordInput.removeAttribute('pattern');
        passwordInput.removeAttribute('title');
    }

    submitButton.textContent = signup ? 'Create account' : 'Log in';
    switchButton.textContent = signup ?
        'Already have an account? Log in' :
        'New here? Create an account';

    message.textContent = '';
    message.removeAttribute('data-state');
}

document.querySelector('#open-account').addEventListener('click', () => {
    dialog.showModal();
});

document.querySelector('#close-account').addEventListener('click', () => {
    dialog.close();
});

dialog.addEventListener('close', () => {
    passwordInput.value = '';
});

switchButton.addEventListener('click', () => {
    if (submitting) return;

    setMode(mode === 'login' ? 'signup' : 'login');
    (mode === 'signup' ? nameInput : emailInput).focus();
});

form.addEventListener('submit', async(event) => {
    event.preventDefault();

    if (submitting || !form.reportValidity()) return;

    const submittedMode = mode;
    const payload = {
        email: emailInput.value,
        password: passwordInput.value
    };

    if (submittedMode === 'signup') {
        payload.name = nameInput.value;
    }

    submitting = true;
    submitButton.disabled = true;
    switchButton.disabled = true;
    submitButton.textContent = 'Please wait…';
    message.textContent = '';

    try {
        const response = await fetch(`/api/customers/${submittedMode}`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            message.dataset.state = 'error';
            message.textContent = data.error || 'Unable to continue.';
            return;
        }
        form.reset();
        window.location.assign('/shop');

    } catch (error) {
        message.dataset.state = 'error';
        message.textContent =
            'We couldn’t confirm the result. Check your connection before trying again.';
    } finally {
        payload.password = '';
        submitting = false;
        submitButton.disabled = false;
        switchButton.disabled = false;
        submitButton.textContent =
            mode === 'signup' ? 'Create account' : 'Log in';
    }
});

const passwordToggle = document.querySelector('#toggle-password');

function hidePassword() {
    passwordInput.type = 'password';
    passwordToggle.textContent = 'Show';
    passwordToggle.setAttribute('aria-pressed', 'false');
    passwordToggle.setAttribute('aria-label', 'Show password');
}

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

dialog.addEventListener('close', hidePassword);
switchButton.addEventListener('click', hidePassword);

setMode('login');
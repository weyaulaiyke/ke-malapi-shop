const form = document.querySelector('#product-form');
const submitButton = document.querySelector('#product-submit');
const message = document.querySelector('#product-form-message');
const photoInput = document.querySelector('#product-photo');

let submitting = false;

form.addEventListener('submit', async(event) => {
    event.preventDefault();

    if (submitting || !form.reportValidity()) {
        return;
    }

    const photo = photoInput.files[0];

    if (!photo) {
        message.dataset.state = 'error';
        message.textContent = 'Please choose a product photo.';
        photoInput.focus();
        return;
    }

    const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp'
    ];

    if (!allowedTypes.includes(photo.type)) {
        message.dataset.state = 'error';
        message.textContent = 'Choose a JPG, PNG or WebP photo.';
        return;
    }

    if (photo.size > 8 * 1024 * 1024) {
        message.dataset.state = 'error';
        message.textContent = 'Your photo must be 8 MB or smaller.';
        return;
    }

    const payload = new FormData(form);

    payload.set(
        'isFeatured',
        document.querySelector('#product-featured').checked ?
        'true' :
        'false'
    );

    submitting = true;
    submitButton.disabled = true;
    submitButton.textContent = 'Publishing…';
    form.setAttribute('aria-busy', 'true');

    message.removeAttribute('data-state');
    message.textContent =
        'Uploading your photo and saving your piece. Please keep this page open.';

    try {
        const response = await fetch('/api/seller/products', {
            method: 'POST',
            credentials: 'same-origin',
            body: payload
        });

        if (response.status === 401) {
            message.dataset.state = 'error';
            message.textContent =
                'Your session has expired. Open seller login in another tab, log in, then return here to publish.';
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            message.dataset.state = 'error';
            message.textContent =
                data.error || 'Unable to publish this piece.';
            return;
        }

        form.reset();
        window.location.assign('/seller');
    } catch (error) {
        message.dataset.state = 'error';
        message.textContent =
            'We couldn’t confirm publication. Check your dashboard in another tab before trying again to avoid duplicates.';
    } finally {
        submitting = false;
        submitButton.disabled = false;
        submitButton.textContent = 'Publish piece';
        form.removeAttribute('aria-busy');
    }
});
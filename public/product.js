const addButton = document.querySelector('#add-to-bag');
const sizeSelect = document.querySelector('#product-size');
const message = document.querySelector('#bag-status');

addButton.addEventListener('click', async() => {
    if (!sizeSelect || !sizeSelect.value) {
        message.dataset.state = 'error';
        message.textContent = 'Please choose your size first.';
        if (sizeSelect) {
            sizeSelect.focus();
        }
        return;
    }

    addButton.disabled = true;
    addButton.textContent = 'Adding…';
    message.textContent = '';
    message.removeAttribute('data-state');

    try {
        const response = await fetch('/api/bag', {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productSizeId: Number(sizeSelect.value),
                quantity: 1
            })
        });

        const data = await response.json();

        if (!response.ok) {
            message.dataset.state = 'error';
            message.textContent = data.error || 'Unable to add this piece.';
            return;
        }

        message.dataset.state = 'success';
        message.textContent = 'Added to your bag.';
    } catch (error) {
        message.dataset.state = 'error';
        message.textContent =
            'We couldn’t confirm whether this was added. Check your bag before trying again.';
    } finally {
        addButton.disabled = false;
        addButton.textContent = 'Add to bag';
    }
});
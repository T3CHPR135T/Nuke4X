document.getElementById('save').addEventListener('click', async() =>
{
    const text = document.getElementById('keywords').value;
    const lines = text.split(','); // should split by comma or \n

    await browser.storage.local.set({
        forbiddenKeywords: lines.filter (l => l.trim() !== '')
    });

    alert("Filter has been updated!")
});

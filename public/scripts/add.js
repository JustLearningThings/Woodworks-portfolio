var input = document.getElementById('images-input');

var label = input.nextElementSibling,
    labelVal = label.innerHTML;

// file input accessibility
input.addEventListener('change', function(e) {
    var fileName = '';

    if(this.files && this.files.length > 1)
        fileName = (this.getAttribute('data-multiple-caption') || '').replace('{count}', this.files.length);
    else
        fileName = e.target.value.split('\\').pop();

    // handle long names
    if(fileName.length > 18)
        fileName = fileName.slice(0, 16).concat('...');

    if(fileName)
        label.querySelector('span').innerHTML = fileName;
    else
        label.innerHTML = labelVal;
});


// FORM AJAX SUBMIT
var form = document.getElementById('add-form');
var errorBox = document.getElementById('error-box');

form.addEventListener('submit', e => {
    e.preventDefault();
    if(errorBox.children) removeMessages();

    var data = new FormData(form);

    axios.post('/api/works', data, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    })
    .then(res => {
        alert('Creat');
        if(res.status !== 201) window.location.replace('/'); //should handle errors
        else {
            if(res.data.status === 'error' && res.data.message) {
                createErrorMessages(res.data.message)
            }
            window.location.replace('/');
        }
        return false;
    })
    .catch(err => createErrorMessages(err.response.data.message));
});

// FORM ERROR HANDLING
function createErrorMessages(message) {
    if(!message) return;
    // err.res.data.message from catch
    var text = message.split('.');
    var lis = [];

    text.forEach(err => {
        var li = document.createElement('LI');

        li.innerText = err;
        errorBox.appendChild(li);
    });

    errorBox.style.display = 'block';
}

function removeMessages() {
   errorBox.innerText = '';
   errorBox.style.display = 'none';
}

// dropdowns
var dropdownRomanian = document.getElementById('dropdown-content-romanian');
var dropdownRussian = document.getElementById('dropdown-content-russian');
var dropdownRomanianBtn = document.getElementById('dropdown-romanian');
var dropdownRussianBtn = document.getElementById('dropdown-russian');

[dropdownRomanianBtn, dropdownRussianBtn].forEach(dropdown => {
    dropdown.onclick = () => {
        // first close the other dropdown, then show the choosen one
        if(dropdown === dropdownRomanianBtn) {
            dropdownRussian.classList.remove('visible-dropdown');
            dropdownRomanian.classList.add('visible-dropdown');
        }
        else if(dropdown === dropdownRussianBtn) {
            dropdownRomanian.classList.remove('visible-dropdown');
            dropdownRussian.classList.add('visible-dropdown');
        }
    };
});
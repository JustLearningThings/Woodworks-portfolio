var eyeSlash = 'fa-eye-slash';
var eye = 'fa-eye';
var icon = document.getElementById('icon');
var input = document.getElementById('password');
var form = document.getElementById('form');
var inputDiv = document.getElementById('pass');

icon.addEventListener('click', () => {
    if(input.type === 'password') {
        input.type = 'text';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
    else if(input.type === 'text') {
        input.type = 'password';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    }
});

form.addEventListener('submit', e => {
    e.preventDefault();

    inputDiv.classList = 'valid-pass';

    if(input.value.length <= 0) {
        inputDiv.classList = 'invalid-pass';
        return;
    }

    axios.post('/login', {password: input.value})
    .then(res => {
        if(res.status !== 'success') window.location.replace('/');
        else {
            console.log(res.status);
            inputDiv.classList = 'invalid-pass';
            window.location.replace('/');
        }
    })
    .catch(() => inputDiv.classList = 'invalid-pass');
});
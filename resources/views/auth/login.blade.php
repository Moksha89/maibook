<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <link href="{{ asset('css/style.css') }}?v={{ time() }}" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>

<!-- Bootstrap 5.3.3 already loaded above (lines 6-7), removed duplicate 5.3.0 with stale SRI hashes -->





<link href="{{ asset('assets_admin/css/login-theme.css') }}?v={{ time() }}" rel="stylesheet">
</head>
<body>
    
    <section class="book-logo-login-sec">
        <div class="container">
            <div class="row">
                <div class="col-sm-12">
                    <div class="book-logo">
                        <img src="{{ asset('images/MIBOOKDEV_LOGO.png') }}" alt="MiBook.dev" style="max-width: 250px; height: auto;">
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="login-form-section">
        <div class="container">



<!-- OTP Modal -->
<div class="modal fade" id="otpModal" tabindex="-1" aria-labelledby="otpModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="otpModalLabel">OTP Verification Method</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>Please choose where to send the OTP:</p>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="otpMethod" id="otpEmail" value="email">
                    <label class="form-check-label" for="otpEmail" id="otpEmailLabel">
                        Email Address: <span id="otpEmailText"></span>
                    </label>
                </div>
                <div class="form-check">
                    <input class="form-check-input" type="radio" name="otpMethod" id="otpSMS" value="sms">
                    <label class="form-check-label" for="otpSMS" id="otpSMSText">
                        SMS: <span id="otpPhoneText"></span>
                    </label>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="button" class="btn btn-primary" id="otpContinue">Continue</button>
            </div>
        </div>
    </div>
</div>





            <div class="row">
                <div class="col-sm-12">
                    <div class="login-div">
                        <form id="loginForm">
                            @csrf
                            <h3 class="title" style="font-size: 28px;">Welcome Back</h3>
                            <p style="font-size: 14px;">Fill out the information below in order to access your account</p>
                            
                            <div class="form-group">
                                <input type="text" id="email" name="email" required autofocus autocomplete="username" class="form-control" placeholder=" ">
                                <label class="floating-label" for="email">Email or Phone or Username</label>
                            </div>

                            <div class="form-group position-relative">
                                <input type="password" id="password" name="password" required autocomplete="current-password" class="form-control" placeholder=" ">
                                <span id="togglePassword" style="cursor: pointer; position: absolute; right: 15px; top: 50%; transform: translateY(-50%);">
                                    <i class="fas fa-eye-slash"></i>
                                </span>
                                <label class="floating-label" for="password">Password</label>
                            </div>

                            <div class="submit-btn">
                                <button type="submit" class="btn btn-primary">Sign In</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>

<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>


    <script>
      // Toggle password visibility
document.getElementById('togglePassword').addEventListener('click', function() {
    const passwordField = document.getElementById('password');
    const type = passwordField.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordField.setAttribute('type', type);
    this.querySelector('i').classList.toggle('fa-eye-slash');
    this.querySelector('i').classList.toggle('fa-eye');
});

// Handle form submission with Axios
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    axios.post('{{ route("customlogin") }}', {
        email: email,
        password: password
    })
    .then(response => {
        if (response.data.message === 'OTP') {
            // Dynamically set the email and phone values
            document.getElementById('otpEmailText').textContent = response.data.user.email;
            document.getElementById('otpPhoneText').textContent = response.data.user.phone;

            // Show the OTP modal
            const otpModal = new bootstrap.Modal(document.getElementById('otpModal'), {});
            otpModal.show();

            // Handle OTP method selection
            document.getElementById('otpContinue').addEventListener('click', function() {
                const selectedMethod = document.querySelector('input[name="otpMethod"]:checked')?.value;
                if (selectedMethod) {
                    // Send OTP using the selected method
                    axios.post('{{ route("sendOtp") }}', {
                        method: selectedMethod,
                        email: email,
                        phone: response.data.user.phone,
                        name: response.data.user.name,
                        username: response.data.user.username,
                        country_code: response.data.user.country_code,
                    })
                    .then(response => {
                        console.log(response);
                        Swal.fire({
                            icon: 'success',
                            title: 'Success',
                            text: response.data.success
                        }).then(() => {
                            window.location.href = response.data.redirect; // Redirect to verification page
                        });
                    })
                    .catch(error => {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: 'Error sending OTP. Please try again.'
                        });
                    });
                } else {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Attention',
                        text: 'Please select an OTP method.'
                    });
                }
            });
        } else if (response.data.message === 'You can only log in from your first registered system.') {
            Swal.fire({
                icon: 'warning',
                title: 'Login Restricted',
                text: 'You can only log in from your first registered system and browser .'
            });
        } else {

            console.log(response.data.message); // "Login successful"
            window.location.href = response.data.redirect;
        }
    })
    .catch(error => {
        console.log(error);
        if (error.response && error.response.status === 422) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.response.data.message // "These credentials do not match our records."
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Unexpected Error',
                text: 'An unexpected error occurred. Please try again.'
            });
        }
    });
});


    </script>
</body>
</html>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ibook</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <link href="{{ asset('css/style.css') }}" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>


<!-- Bootstrap CSS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-9ndCyUaDaOMs0xYodr0O+uXDzY1B1/gBs91+hoMeG1IE7/cD1LZM/Ox2CxI25ByU" crossorigin="anonymous">

<!-- Bootstrap JS and Popper.js -->
<script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js" integrity="sha384-oBqDVmMz4fnFO9gybBHU7ZK2kFrHgSZkDf1m2x57SglWoUqjQ4Zr74SXkp4Bk0qKb" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.min.js" integrity="sha384-wyIiSRI5ZoqSXTb1Q6HRXWxCgx8H4ZfFx1e2AOl6W7x57nGHE3yDXHA5a+UtENwF" crossorigin="anonymous"></script>



<style>
body.oft{
background:#EBECF0;
}

.verifyOtp-box{
background:#fff;
padding:50px 30px;
width:40%;
margin:50px auto;
text-align:center;

}

.verifyOtp-box input#otpInput {
    border: 2px solid #999;
    padding: 10px 12px;
}
.verifyOtp-box h2{ 
text-align:center;
font-size:27px;
}

.verify-btn{
background:#FFC107;
font-size:20px;
border:none;
padding:7px 30px;
text-align:center;
    border-radius: 30px;
}

.verify-btn:hover{
background:#444;
}
label.form-label {
    text-align: left;
    float: left;
}



@media(min-width: 240px) and (max-width: 479px) {

.verifyOtp-box {
    width: 100% !important;
}
}


@media(min-width: 480px) and (max-width: 767px) {

.verifyOtp-box {
    width: 100% !important;
}
}


@media(min-width: 768px) and (max-width: 999px) {

.verifyOtp-box {
    width: 50% !important;
}
}


</style>


</head>


<body class="oft">
<div class="container">
<div class="col-sm-12">

<div class="verifyOtp-box">
    <h2>Verify Your OTP</h2>
    <form id="verifyOtpForm">
        @csrf
        <div class="mb-3">
            <label for="otpInput" class="form-label">Enter OTP:</label>
            <input type="text" id="otpInput" class="form-control" placeholder="Enter your OTP" required>
            <input type="hidden" id="username" value="{{$username}}" class="form-control" placeholder="Enter your OTP" required>
        </div>
        <button type="submit" class="btn btn-primary verify-btn">Verify OTP</button>
    </form>
    <div id="otpResponse" class="mt-3"></div>
</div>
</div>
</div>


<script>
document.getElementById('verifyOtpForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent default form submission

    const otpValue = document.getElementById('otpInput').value;
    const username = document.getElementById('username').value;

    axios.post('{{ route("verifyOtp") }}', {
        otp: otpValue,
        username:username,

    })
    .then(response => {
        document.getElementById('otpResponse').innerHTML = '<div class="alert alert-success">' + response.data.success + '</div>';
        setTimeout(() => {
            window.location.href = response.data.redirect; // Redirect to the dashboard
        }, 2000); // Redirect after 2 seconds
    })
    .catch(error => {
        document.getElementById('otpResponse').innerHTML = '<div class="alert alert-danger">' + error.response.data.error + '</div>';
    });
});
</script>

</body>
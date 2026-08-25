@extends('layouts.admin')

@section('content')


<style>










#edit_user .text-center {
    text-align: left !important;
}
.all_toogle_switch label {
    margin-bottom: 0px !important;
}
.all_toogle_switch {
    display: flex;
    align-items: center;
    gap: 5px;
}
.full_read {
    display: flex;
    align-items: center;
}



/* General Styling for All Toggles */
.all_toogle_switch {
  font-family: Arial, sans-serif;
  margin-bottom: 20px;
}

/* Main Toggle */
.switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 2px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #000;
}

input:checked + .slider:before {
  transform: translateX(21px);
}







.container.edit_user_container {
    padding: 50px 15px;
}
.edit_user_forms {
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    padding: 30px 25px;
    width: 100%;
    margin: auto;
    border-radius: 10px;
}
#edit_user input {
    color: #000;
    padding: 10px 10px;
    text-align: start;
    font-size: 16px;
    background: #fff;
    border: 1px solid #efefef;
    height: auto !important;
}
select#country_code {
    height: auto !important;
    padding: 10px;
    font-size: 16px;
}
.edit_user_forms .Create-btn {
    background: #FF9800 !important;
    border: 1px solid #FF9800 !important;
    line-height: normal;
    padding: 8px 20px;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    border-radius: 5px;
}
.companies_flex {
    margin-bottom: 20px;
}
.all_name_flex {
    display: grid;
    grid-template-columns: 48% 48%;
    column-gap: 4%;
}




@media(min-width: 240px) and (max-width: 479px) {

.edit_user_forms {
    width: 100%;
}
.mobile-navbar button.navbar-toggler {
    padding: 0px;
}
.all_name_flex {
    grid-template-columns: 100%;
    column-gap: 0px;
    row-gap: 10px;
}



.all_toogle_switch {
    display: block !important;
    margin-bottom: 20px !important;
}
.tgle_stch {
    display: inline-block !important;
    margin-right: 10px !important;
}
.tgl_sch {
    display: inline-block !important;
}
.full_read {
    display: block !important;
    margin-left: 0px !important;
}
.all_toogle_switch label {
    margin-bottom: 8px !important;
}
}


@media(min-width: 480px) and (max-width: 767px) {

.edit_user_forms {
    width: 100%;
}
.mobile-navbar button.navbar-toggler {
    padding: 0px;
}
.all_name_flex {
    grid-template-columns: 100%;
    column-gap: 0px;
    row-gap: 10px;
}


.all_toogle_switch {
    display: block !important;
    margin-bottom: 20px !important;
}
.tgle_stch {
    display: inline-block !important;
    margin-right: 10px !important;
}
.tgl_sch {
    display: inline-block !important;
}
.full_read {
    display: block !important;
    margin-left: 0px !important;
}
.all_toogle_switch label {
    margin-bottom: 8px !important;
}
}



@media(min-width: 768px) and (max-width: 999px) {

.edit_user_forms {
    width: 100%;
}
}


</style>


<style type="text/css">
/*    .switch-field {
    display: flex;
    margin-bottom: 36px;
    overflow: hidden;
}

.switch-field input {
    position: absolute !important;
    clip: rect(0, 0, 0, 0);
    height: 1px;
    width: 1px;
    border: 0;
    overflow: hidden;
}

.switch-field label {
    background-color: #e4e4e4;
    color: rgba(0, 0, 0, 0.6);
    font-size: 14px;
    line-height: 1;
    text-align: center;
    padding: 8px 16px !important;
    margin-right: -1px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.3), 0 1px rgba(255, 255, 255, 0.1);
    transition: all 0.1s ease-in-out;
}

.switch-field label:hover {
    cursor: pointer;
}

.switch-field input:checked + label {
    background-color: #a5dc86;
    box-shadow: none;
}

.switch-field label:first-of-type {
    border-radius: 4px 0 0 4px;
}

.switch-field label:last-of-type {
    border-radius: 0 4px 4px 0;
}


.form {
    max-width: 600px;
    font-family: "Lucida Grande", Tahoma, Verdana, sans-serif;
    font-weight: normal;
    line-height: 1.625;
    margin: 8px auto;
    padding: 16px;
}

h2 {
    font-size: 18px;
    margin-bottom: 8px;
}*/
</style>


<!-- Start Edit User Form -->
<div class="container edit_user_container">
    <div class="edit_user_forms">
    <h1 class="mb-4">Edit User</h1>

<form id="edit_user" action="{{ route('user.update') }}" method="post">
    @csrf
    
    <input type="hidden" name="id" id="edit_id" value="{{ $user->id }}">
     
     <div class="all_name_flex">
      <div class="form-group mb-3">
        <input type="text" class="form-control" id="exampleInputEmail1" name="name" placeholder="" value="{{ $user->name }}">
        <label class="floating-label" for="exampleInputEmail1"><i class='fas fa-user-alt'></i>Name</label>
      </div>

      <div class="form-group mb-3">
        <input type="text" class="form-control" id="exampleInputEmail1" name="username" placeholder="" value="{{ $user->username }}">
        <label class="floating-label" for="exampleInputEmail1"><i class='fas fa-user-alt'></i>Username</label>
      </div>
    </div>
     
     <div class="all_name_flex">
    <div class="form-group mb-3">
        <input type="text" class="form-control" id="exampleInputEmail1" name="phone" placeholder="" value="{{ $user->phone }}">
        <label class="floating-label" for="exampleInputEmail1"><i class="fa fa-phone"></i>Phone</label>
    </div>

    <div class="form-group mb-3">
         <select name="country_code" id="country_code" class="form-select">
    <option value="">Country Code</option>
    <option value="+93">Afghanistan (+93)</option>
    <option value="+355">Albania (+355)</option>
    <option value="+213">Algeria (+213)</option>
    <option value="+1-684">American Samoa (+1-684)</option>
    <option value="+376">Andorra (+376)</option>
    <option value="+244">Angola (+244)</option>
    <option value="+1-264">Anguilla (+1-264)</option>
    <option value="+672">Antarctica (+672)</option>
    <option value="+1-268">Antigua and Barbuda (+1-268)</option>
    <option value="+54">Argentina (+54)</option>
    <option value="+374">Armenia (+374)</option>
    <option value="+297">Aruba (+297)</option>
    <option value="+61">Australia (+61)</option>
    <option value="+43">Austria (+43)</option>
    <option value="+994">Azerbaijan (+994)</option>
    <option value="+1-242">Bahamas (+1-242)</option>
    <option value="+973">Bahrain (+973)</option>
    <option value="+880">Bangladesh (+880)</option>
    <option value="+1-246">Barbados (+1-246)</option>
    <option value="+375">Belarus (+375)</option>
    <option value="+32">Belgium (+32)</option>
    <option value="+501">Belize (+501)</option>
    <option value="+229">Benin (+229)</option>
    <option value="+1-441">Bermuda (+1-441)</option>
    <option value="+975">Bhutan (+975)</option>
    <option value="+591">Bolivia (+591)</option>
    <option value="+387">Bosnia and Herzegovina (+387)</option>
    <option value="+267">Botswana (+267)</option>
    <option value="+55">Brazil (+55)</option>
    <option value="+246">British Indian Ocean Territory (+246)</option>
    <option value="+1-284">British Virgin Islands (+1-284)</option>
    <option value="+673">Brunei (+673)</option>
    <option value="+359">Bulgaria (+359)</option>
    <option value="+226">Burkina Faso (+226)</option>
    <option value="+257">Burundi (+257)</option>
    <option value="+855">Cambodia (+855)</option>
    <option value="+237">Cameroon (+237)</option>
    <option value="+1">Canada (+1)</option>
    <option value="+238">Cape Verde (+238)</option>
    <option value="+1-345">Cayman Islands (+1-345)</option>
    <option value="+236">Central African Republic (+236)</option>
    <option value="+235">Chad (+235)</option>
    <option value="+56">Chile (+56)</option>
    <option value="+86">China (+86)</option>
    <option value="+61">Christmas Island (+61)</option>
    <option value="+61">Cocos Islands (+61)</option>
    <option value="+57">Colombia (+57)</option>
    <option value="+269">Comoros (+269)</option>
    <option value="+682">Cook Islands (+682)</option>
    <option value="+506">Costa Rica (+506)</option>
    <option value="+385">Croatia (+385)</option>
    <option value="+53">Cuba (+53)</option>
    <option value="+599">Curacao (+599)</option>
    <option value="+357">Cyprus (+357)</option>
    <option value="+420">Czech Republic (+420)</option>
    <option value="+243">Democratic Republic of the Congo (+243)</option>
    <option value="+45">Denmark (+45)</option>
    <option value="+253">Djibouti (+253)</option>
    <option value="+1-767">Dominica (+1-767)</option>
    <option value="+1-809">Dominican Republic (+1-809)</option>
    <option value="+670">East Timor (+670)</option>
    <option value="+593">Ecuador (+593)</option>
    <option value="+20">Egypt (+20)</option>
    <option value="+503">El Salvador (+503)</option>
    <option value="+240">Equatorial Guinea (+240)</option>
    <option value="+291">Eritrea (+291)</option>
    <option value="+372">Estonia (+372)</option>
    <option value="+251">Ethiopia (+251)</option>
    <option value="+500">Falkland Islands (+500)</option>
    <option value="+298">Faroe Islands (+298)</option>
    <option value="+679">Fiji (+679)</option>
    <option value="+358">Finland (+358)</option>
    <option value="+33">France (+33)</option>
    <option value="+689">French Polynesia (+689)</option>
    <option value="+241">Gabon (+241)</option>
    <option value="+220">Gambia (+220)</option>
    <option value="+995">Georgia (+995)</option>
    <option value="+49">Germany (+49)</option>
    <option value="+233">Ghana (+233)</option>
    <option value="+350">Gibraltar (+350)</option>
    <option value="+30">Greece (+30)</option>
    <option value="+299">Greenland (+299)</option>
    <option value="+1-473">Grenada (+1-473)</option>
    <option value="+1-671">Guam (+1-671)</option>
    <option value="+502">Guatemala (+502)</option>
    <option value="+44-1481">Guernsey (+44-1481)</option>
    <option value="+224">Guinea (+224)</option>
    <option value="+245">Guinea-Bissau (+245)</option>
    <option value="+592">Guyana (+592)</option>
    <option value="+509">Haiti (+509)</option>
    <option value="+504">Honduras (+504)</option>
    <option value="+852">Hong Kong (+852)</option>
    <option value="+36">Hungary (+36)</option>
    <option value="+354">Iceland (+354)</option>
    <option value="+91">India (+91)</option>
    <option value="+62">Indonesia (+62)</option>
    <option value="+98">Iran (+98)</option>
    <option value="+964">Iraq (+964)</option>
    <option value="+353">Ireland (+353)</option>
    <option value="+44-1624">Isle of Man (+44-1624)</option>
    <option value="+972">Israel (+972)</option>
    <option value="+39">Italy (+39)</option>
    <option value="+225">Ivory Coast (+225)</option>
    <option value="+1-876">Jamaica (+1-876)</option>
    <option value="+81">Japan (+81)</option>
    <option value="+44-1534">Jersey (+44-1534)</option>
    <option value="+962">Jordan (+962)</option>
    <option value="+7">Kazakhstan (+7)</option>
    <option value="+254">Kenya (+254)</option>
    <option value="+686">Kiribati (+686)</option>
    <option value="+383">Kosovo (+383)</option>
    <option value="+965">Kuwait (+965)</option>
    <option value="+996">Kyrgyzstan (+996)</option>
    <option value="+856">Laos (+856)</option>
    <option value="+371">Latvia (+371)</option>
    <option value="+961">Lebanon (+961)</option>
    <option value="+266">Lesotho (+266)</option>
    <option value="+231">Liberia (+231)</option>
    <option value="+218">Libya (+218)</option>
    <option value="+423">Liechtenstein (+423)</option>
    <option value="+370">Lithuania (+370)</option>
    <option value="+352">Luxembourg (+352)</option>
    <option value="+853">Macau (+853)</option>
    <option value="+389">North Macedonia (+389)</option>
    <option value="+261">Madagascar (+261)</option>
    <option value="+265">Malawi (+265)</option>
    <option value="+60">Malaysia (+60)</option>
    <option value="+960">Maldives (+960)</option>
    <option value="+223">Mali (+223)</option>
    <option value="+356">Malta (+356)</option>
    <option value="+692">Marshall Islands (+692)</option>
    <option value="+222">Mauritania (+222)</option>
    <option value="+230">Mauritius (+230)</option>
    <option value="+262">Mayotte (+262)</option>
    <option value="+52">Mexico (+52)</option>
    <option value="+691">Micronesia (+691)</option>
    <option value="+373">Moldova (+373)</option>
    <option value="+377">Monaco (+377)</option>
    <option value="+976">Mongolia (+976)</option>
    <option value="+382">Montenegro (+382)</option>
    <option value="+1-664">Montserrat (+1-664)</option>
    <option value="+212">Morocco (+212)</option>
    <option value="+258">Mozambique (+258)</option>
    <option value="+95">Myanmar (+95)</option>
    <option value="+264">Namibia (+264)</option>
    <option value="+674">Nauru (+674)</option>
    <option value="+977">Nepal (+977)</option>
    <option value="+31">Netherlands (+31)</option>
    <option value="+687">New Caledonia (+687)</option>
    <option value="+64">New Zealand (+64)</option>
    <option value="+505">Nicaragua (+505)</option>
    <option value="+227">Niger (+227)</option>
    <option value="+234">Nigeria (+234)</option>
    <option value="+683">Niue (+683)</option>
    <option value="+850">North Korea (+850)</option>
    <option value="+1-670">Northern Mariana Islands (+1-670)</option>
    <option value="+47">Norway (+47)</option>
    <option value="+968">Oman (+968)</option>
    <option value="+92">Pakistan (+92)</option>
    <option value="+680">Palau (+680)</option>
    <option value="+970">Palestine (+970)</option>
    <option value="+507">Panama (+507)</option>
    <option value="+675">Papua New Guinea (+675)</option>
    <option value="+595">Paraguay (+595)</option>
    <option value="+51">Peru (+51)</option>
    <option value="+63">Philippines (+63)</option>
    <option value="+48">Poland (+48)</option>
    <option value="+351">Portugal (+351)</option>
    <option value="+1-787">Puerto Rico (+1-787)</option>
    <option value="+974">Qatar (+974)</option>
    <option value="+242">Republic of the Congo (+242)</option>
    <option value="+40">Romania (+40)</option>
    <option value="+7">Russia (+7)</option>
    <option value="+250">Rwanda (+250)</option>
    <option value="+590">Saint Barthelemy (+590)</option>
    <option value="+290">Saint Helena (+290)</option>
    <option value="+1-869">Saint Kitts and Nevis (+1-869)</option>
    <option value="+1-758">Saint Lucia (+1-758)</option>
    <option value="+590">Saint Martin (+590)</option>
    <option value="+508">Saint Pierre and Miquelon (+508)</option>
    <option value="+1-784">Saint Vincent and the Grenadines (+1-784)</option>
    <option value="+685">Samoa (+685)</option>
    <option value="+378">San Marino (+378)</option>
    <option value="+239">Sao Tome and Principe (+239)</option>
    <option value="+966">Saudi Arabia (+966)</option>
    <option value="+221">Senegal (+221)</option>
    <option value="+381">Serbia (+381)</option>
    <option value="+248">Seychelles (+248)</option>
    <option value="+232">Sierra Leone (+232)</option>
    <option value="+65">Singapore (+65)</option>
    <option value="+1-721">Sint Maarten (+1-721)</option>
    <option value="+421">Slovakia (+421)</option>
    <option value="+386">Slovenia (+386)</option>
    <option value="+677">Solomon Islands (+677)</option>
    <option value="+252">Somalia (+252)</option>
    <option value="+27">South Africa (+27)</option>
    <option value="+82">South Korea (+82)</option>
    <option value="+211">South Sudan (+211)</option>
    <option value="+34">Spain (+34)</option>
    <option value="+94">Sri Lanka (+94)</option>
    <option value="+249">Sudan (+249)</option>
    <option value="+597">Suriname (+597)</option>
    <option value="+47">Svalbard and Jan Mayen (+47)</option>
    <option value="+268">Swaziland (+268)</option>
    <option value="+46">Sweden (+46)</option>
    <option value="+41">Switzerland (+41)</option>
    <option value="+963">Syria (+963)</option>
    <option value="+886">Taiwan (+886)</option>
    <option value="+992">Tajikistan (+992)</option>
    <option value="+255">Tanzania (+255)</option>
    <option value="+66">Thailand (+66)</option>
    <option value="+228">Togo (+228)</option>
    <option value="+690">Tokelau (+690)</option>
    <option value="+676">Tonga (+676)</option>
    <option value="+1-868">Trinidad and Tobago (+1-868)</option>
    <option value="+216">Tunisia (+216)</option>
    <option value="+90">Turkey (+90)</option>
    <option value="+993">Turkmenistan (+993)</option>
    <option value="+1-649">Turks and Caicos Islands (+1-649)</option>
    <option value="+688">Tuvalu (+688)</option>
    <option value="+256">Uganda (+256)</option>
    <option value="+380">Ukraine (+380)</option>
    <option value="+971">United Arab Emirates (+971)</option>
    <option value="+44">United Kingdom (+44)</option>
    <option value="+1">United States (+1)</option>
    <option value="+598">Uruguay (+598)</option>
    <option value="+998">Uzbekistan (+998)</option>
    <option value="+678">Vanuatu (+678)</option>
    <option value="+379">Vatican (+379)</option>
    <option value="+58">Venezuela (+58)</option>
    <option value="+84">Vietnam (+84)</option>
    <option value="+1-284">British Virgin Islands (+1-284)</option>
    <option value="+1-340">U.S. Virgin Islands (+1-340)</option>
    <option value="+681">Wallis and Futuna (+681)</option>
    <option value="+212">Western Sahara (+212)</option>
    <option value="+967">Yemen (+967)</option>
    <option value="+260">Zambia (+260)</option>
    <option value="+263">Zimbabwe (+263)</option>
</select>
    </div>
</div>
     
     <div class="all_name_flex">
    <div class="form-group mb-3">
        <input type="text" class="form-control" id="exampleInputEmail1" name="email" placeholder="" value="{{ $user->email }}">
        <label class="floating-label" for="exampleInputEmail1"><i class="fa fa-envelope"></i>Email</label>
    </div>

    <div class="form-group mb-3">
        <!-- Role Selection -->
        <select name="role" id="Role" onchange="showAccess(this.value)" class="form-select">
@if(Auth::user()->is_superadmin && Auth::user()->is_admin)
             <option value="">Role</option>
            <option value="admin" {{ $user->is_admin == 1 ? 'selected' : '' }}>Admin</option>
            <option value="manager" {{ $user->is_manager == 1 ? 'selected' : '' }}>Manager</option>
            <option value="employee" {{ $user->is_employee == 1 ? 'selected' : '' }}>Employee</option>


              @elseif(Auth::user()->is_admin)
            <option value="">Role</option>
            <!-- <option value="admin" {{ $user->is_admin == 1 ? 'selected' : '' }}>Admin</option> -->
            <option value="manager" {{ $user->is_manager == 1 ? 'selected' : '' }}>Manager</option>
            <option value="employee" {{ $user->is_employee == 1 ? 'selected' : '' }}>Employee</option>
          
            @else(Auth::user()->is_manager)
            <option value="">Role</option>
            <!-- <option value="admin" {{ $user->is_admin == 1 ? 'selected' : '' }}>Admin</option>
            <option value="manager" {{ $user->is_manager == 1 ? 'selected' : '' }}>Manager</option> -->
            <option value="employee" {{ $user->is_employee == 1 ? 'selected' : '' }}>Employee</option>
            
             @endif

             
            
        </select>
    </div>
</div>
  <div class="all_name_flex">
  <div class="form-group mb-3">
        <input type="text" class="form-control" name="country" id="exampleInputEmail1" placeholder="" value="{{ $user->country }}">
        <label class="floating-label" for="exampleInputEmail1"><i class="fa fa-lock"></i>Country</label>
    </div>


<div class="form-group mb-3" style="display:none;" id="tabs_select">
    <!-- Tab Selection -->
    <input type="checkbox" name="employee_tab" value="1" id="employee_tab" @if($user->employee_tab == 1) checked @endif>
    <label for="employee_tab">Employee Tab</label>

    <input type="checkbox" name="backup_tab" value="1" id="backup_tab" @if($user->backup_tab == 1) checked @endif>
    <label for="backup_tab">Backup Tab</label>
</div>
</div>



     <div class="companies_flex">
    <!-- Companies Assign Selection (Initially Hidden) -->
    <div class="form-group mb-3" id="companies-select_edit" style="display: none;">
        <label>Assign Companies with Access Level:</label>
        <div id="companies-checkboxes">
            @foreach ($allCompanies as $company)
                <div style="margin-bottom: 10px;">
                    <input type="checkbox" name="companies_access[{{ $company->id }}][selected]" value="1" id="edit_company_{{ $company->id }}"
                           onchange="toggleAccessLevel({{ $company->id }})"
                           {{ $companiesAccess->pluck('company_id')->contains($company->id) ? 'checked' : '' }}>
                    <label for="edit_company_{{ $company->id }}">{{ $company->name }}</label>

                    <div id="access_options_{{ $company->id }}" style="display: inline-block; margin-left: 10px;">
                        <input type="radio" name="companies_access[{{ $company->id }}][access_level]" value="full" id="full_access_{{ $company->id }}"
                               {{ $companiesAccess->where('company_id', $company->id)->where('access_level', 'full')->isNotEmpty() ? 'checked' : '' }}>
                        <label for="full_access_{{ $company->id }}">Full Access</label>

                        <input type="radio" name="companies_access[{{ $company->id }}][access_level]" value="read" id="read_only_{{ $company->id }}"
                               {{ $companiesAccess->where('company_id', $company->id)->where('access_level', 'read')->isNotEmpty() ? 'checked' : '' }}>
                        <label for="read_only_{{ $company->id }}">Read-Only</label>
                    </div>
                </div>
            @endforeach
        </div>
    </div>
</div>

  

    <div class="text-center">
        <button type="submit" class="btn btn-primary Create-btn">Edit User</button>
    </div>
</form>
</div>
</div>
<!-- End Edit User Form -->



@endsection

@section('scripts')
@parent


@if ($errors->any())
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            let errorMessages = '';
            @foreach ($errors->all() as $error)
                errorMessages += '{{ $error }}<br>';
            @endforeach
            Swal.fire({
                icon: 'error',
                title: 'Validation Error',
                html: errorMessages,
                showConfirmButton: true
            });
        });
    </script>
@endif

@if (session('success'))
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: '{{ session('success') }}',
                timer: 2000,
                showConfirmButton: false
            });
        });
    </script>
@endif

@if (session('error'))
    <script>
        document.addEventListener('DOMContentLoaded', function () {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: '{{ session('error') }}',
                showConfirmButton: true
            });
        });
    </script>
@endif


<script>






document.addEventListener("DOMContentLoaded", function() {
    // Call showAccess with the current role to set the initial state
    const roleSelect = document.getElementById('Role');
    showAccess(roleSelect.value); // Call with the current selected role

    document.getElementById('country_code').value = '{{$user->country_code}}';

});

function showAccess(role) {
    const companiesSelect = document.getElementById('companies-select_edit');
    const tabs_select = document.getElementById('tabs_select');
    if (role === 'manager' || role === 'employee') {
if(role === 'manager')
{
tabs_select.style.display = 'block';
       
}
else
{
tabs_select.style.display = 'none';
}

 companiesSelect.style.display = 'block';


    } else {
        companiesSelect.style.display = 'none';
        tabs_select.style.display = 'none';
    }
}



function toggleAccessLevel(companyId) {
    // Get the checkbox and the associated radio buttons
    const checkbox = document.getElementById(`edit_company_${companyId}`);
    const accessOptions = document.querySelectorAll(`#access_options_${companyId} input[type="radio"]`);

    // Enable or disable radio buttons based on the checkbox state
    accessOptions.forEach(radio => {
        radio.disabled = !checkbox.checked;
    });
}

// Initialize: disable all radio buttons if checkboxes are unchecked on page load
document.addEventListener("DOMContentLoaded", () => {
    @foreach($allCompanies as $company)
        toggleAccessLevel({{ $company->id }});
    @endforeach
});




</script>




@endsection

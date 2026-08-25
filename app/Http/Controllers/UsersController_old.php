<?php



namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
require base_path('vendor_pdf/autoload.php');
use Mpdf\Mpdf;
use App\Models\Partner;
use App\Models\Company;
use App\Models\UserCompanyAccess;
use App\Models\User;

use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Auth;

class UsersController extends Controller
{


// public function store(Request $request)
// {

// 	// dd($request->all());
//     // Validate incoming request data
//     $validatedData = $request->validate([
//         'name' => 'required|string|max:255',
//         'username' => 'required|string|max:255|unique:users,username',
//         'phone' => 'required|string|max:20',
//         'email' => 'required|email',
//         'password' => 'required|string|min:6',
//         'country' => 'required|string',
//         'country_code' => 'required',
//         'role' => 'required|string',
//         'has_admin_privileges' => 'required_if:role,manager,employee', // Only required if not admin
//         'companies_access' => 'required_if:role,manager,employee', // Only required if not admin
//     ]);

//     // Set role-based flags
//     $isAdmin = $request->role === 'admin' ? 1 : 0;
//     $isManager = $request->role === 'manager' ? 1 : 0;
//     $isEmployee = $request->role === 'employee' ? 1 : 0;

//     // Set optional fields for non-admin roles
//     $hasAdminPrivileges = 1;
//     $companiesAccess = null;
//     if ($isAdmin == 0) {
//         $hasAdminPrivileges = $request->has_admin_privileges;
//         $companiesAccess = implode(',', $request->companies_access);
//     }

//     // Hash the password before saving using password_hash
//     $validatedData['password'] = password_hash($request->password, PASSWORD_DEFAULT);

//     // Create a new user with validated data
//     $user = User::create([
//         'name' => $validatedData['name'],
//         'user_id' => $validatedData['name'],
//         'username' => $validatedData['username'],
//         'phone' => $validatedData['phone'],
//         'email' => $validatedData['email'],
//         'password' => $validatedData['password'],
//         'country_code' => $validatedData['country_code'],
//         'is_admin' => $isAdmin,
//         'is_manager' => $isManager,
//         'is_employee' => $isEmployee,
//         'has_admin_priviledges' => $hasAdminPrivileges,
//         'companies_acess' => $companiesAccess ? $companiesAccess : null, // Store as JSON if set,
//         'country'=>$validatedData['country'],
//     ]);

//     // Redirect or return a response
//     if ($user) {
//         return redirect()->back()->with('success', 'User created successfully!');
//     } else {
//         return redirect()->back()->with('error', 'User creation failed!');
//     }
// }



public function store(Request $request)
{
    // Validate incoming request data
$validatedData = $request->validate([
    'name' => 'required|string|max:255',
    'username' => 'required|string|max:255|unique:users,username',
    'phone' => 'required|string|max:20',
    'email' => 'required|email|unique:users,email',
    'password' => 'required|string|min:6',
    'country' => 'required|string',
    'country_code' => 'required|string',
    'role' => 'required|string',
]);

dd($validatedData);

    // Set role-based flags
    $isAdmin = $request->role === 'admin' ? 1 : 0;
    $isManager = $request->role === 'manager' ? 1 : 0;
    $isEmployee = $request->role === 'employee' ? 1 : 0;

    // Hash the password before saving
    $validatedData['password'] = password_hash($request->password, PASSWORD_DEFAULT);

    // Create a new user
    $user = User::create([
        'name' => $validatedData['name'],
        'user_id' => $validatedData['name'],
        'username' => $validatedData['username'],
        'phone' => $validatedData['phone'],
        'email' => $validatedData['email'],
        'password' => $validatedData['password'],
        'country_code' => $validatedData['country_code'],
        'is_admin' => $isAdmin,
        'is_manager' => $isManager,
        'is_employee' => $isEmployee,
        'country' => $validatedData['country'],
    ]);




    // Assign employee_tab and backup_tab based on role
    if ($user) {
        if ($isAdmin) {
            $user->employee_tab = 1;
            $user->backup_tab = 1;
        } elseif ($isManager) {
            $user->employee_tab = $request->has('employee_tab') ? 1 : 0;
            $user->backup_tab = $request->has('backup_tab') ? 1 : 0;
        }

        // Save the updates to the user
        $user->save();
    }




    // Assign company access levels
    if ($user && !$isAdmin) {
        foreach ($request->input('companies_access', []) as $companyId => $accessData) {
            if (isset($accessData['selected']) && $accessData['selected']) {
                DB::table('user_company_access')->insert([
                    'user_id' => $user->id,
                    'company_id' => $companyId,
                    'access_level' => $accessData['access_level'],
                   
                ]);
            }
        }
    }

    // Redirect or return a response
    if ($user) {
        return redirect()->back()->with('success', 'User created successfully!');
    } else {
        return redirect()->back()->with('error', 'User creation failed!');
    }
}


public function update(Request $request)
{
    // Validate the incoming request data
    $request->validate([
        'id' => 'required|exists:users,id', // Ensure user ID exists
        'name' => 'required|string|max:255',
        'username' => 'required|string|max:255|unique:users,username,' . $request->id,
        'phone' => 'nullable|string|max:20',
        'country_code' => 'nullable|string|max:10',
        'email' => 'required|email|max:255|unique:users,email,' . $request->id,
        'role' => 'required|string|in:admin,manager,employee',
        'companies_access' => 'array', // Ensure it is an array
        'companies_access.*.selected' => 'boolean',
        'companies_access.*.access_level' => 'nullable|string|in:full,read',
        'country' => 'nullable|string|max:255',
    ]);

    // Set role-based flags
    $isAdmin = $request->role === 'admin' ? 1 : 0;
    $isManager = $request->role === 'manager' ? 1 : 0;
    $isEmployee = $request->role === 'employee' ? 1 : 0;

    // Find the user by ID
    $user = User::findOrFail($request->id); // Using findOrFail for better error handling
    
    // Update user fields
    $user->name = $request->name;
    $user->user_id = $request->name;
    $user->username = $request->username;
    $user->phone = $request->phone;
    $user->country_code = $request->country_code;
    $user->email = $request->email;
    $user->is_admin = $isAdmin;
    $user->is_manager = $isManager;
    $user->is_employee = $isEmployee;
    $user->country = $request->country;

if($isAdmin)
{
    $user->employee_tab=1;
    $user->backup_tab=1;
}

if($isManager)
{
   $user->employee_tab= $request->has('employee_tab') ? 1 : 0;
    $user->backup_tab=$request->has('backup_tab') ? 1 : 0;
}

    $user->save();

    // Manage companies access levels
    if (isset($request->companies_access)) {

         
 //delete all from companyacess where user_id is $user->id
         $companyAccess = UserCompanyAccess::where('user_id', $user->id)->delete();
         
        foreach ($request->companies_access as $companyId => $data) {
            // Check if the company access record exists for the user
            $companyAccess = UserCompanyAccess::where('user_id', $user->id)
                                               ->where('company_id', $companyId)
                                               ->first();

            // Update or create access level based on checkbox selection
            if (isset($data['selected']) && $data['selected']) {
                if ($companyAccess) {
                    $companyAccess->access_level = $data['access_level'] ?? $companyAccess->access_level; // Preserve existing level if not provided
                    $companyAccess->save();
                } else {
                    UserCompanyAccess::create([
                        'user_id' => $user->id,
                        'company_id' => $companyId,
                        'access_level' => $data['access_level'],
                    ]);
                }
            } else {
                // If checkbox is not selected, delete the access record
                if ($companyAccess) {
                    $companyAccess->delete();
                }
            }
        }
    }else
    {
        //delete all from companyacess where user_id is $user->id
         $companyAccess = UserCompanyAccess::where('user_id', $user->id)->delete();

    }

    // Redirect back with success message
    return redirect()->route('setting')->with('success', 'User updated successfully.');
}

public function update_emp(Request $req)
{
    // Validate the request data
    $req->validate([
        'id' => 'required|exists:users,id',  // Check if user ID exists in the database
        'password' => 'required|string|min:8|confirmed',  // Validate password and confirmation
    ]);

    // Find the user by ID
    $user = User::findOrFail($req->id);

    // Hash the new password
    $user->password = Hash::make($req->password);

    // Save the updated user data
    $user->save();

      // Redirect back with success message
    return redirect()->route('setting')->with('success', 'User Paasword updated successfully.');
}


// public function update(Request $request)
// {

// 	 // dd($request->all());
//     // Validate incoming request data
//     $validatedData = $request->validate([
//     	'id'=>'required',
//         'name' => 'required|string|max:255',
//         'username' => 'required',
//         'phone' => 'required|string|max:20',
//         'email' => 'required|email',
      
//         'country' => 'required|string',
//         'country_code' => 'required',
//         'role' => 'required|string',
        
//         'companies_access' => 'required_if:role,manager,employee', // Only required if not admin
//     ]);

//     // Set role-based flags
//     $isAdmin = $request->role === 'admin' ? 1 : 0;
//     $isManager = $request->role === 'manager' ? 1 : 0;
//     $isEmployee = $request->role === 'employee' ? 1 : 0;

//     // Set optional fields for non-admin roles
//     $hasAdminPrivileges = 1;
//     $companiesAccess = null;
//     if ($isAdmin == 0) {
//         $hasAdminPrivileges = $request->has_admin_privileges;
//         $companiesAccess = implode(',', $request->companies_access);
//     }

//     $id=$validatedData['id'];

//     // Hash the password before saving using password_hash
//     // $validatedData['password'] = password_hash($request->password, PASSWORD_DEFAULT);




//     // Create a new user with validated data
//     $user = User::where('id',$id)->update([
//         'name' => $validatedData['name'],
//         'user_id' => $validatedData['name'],
//         'username' => $validatedData['username'],
//         'phone' => $validatedData['phone'],
//         'email' => $validatedData['email'],
      
//         'country_code' => $validatedData['country_code'],
//         'is_admin' => $isAdmin,
//         'is_manager' => $isManager,
//         'is_employee' => $isEmployee,
        
//         'companies_acess' => $companiesAccess ? $companiesAccess : null, // Store as JSON if set,
//         'country'=>$validatedData['country'],
//     ]);

//     // Redirect or return a response
//     if ($user) {
//         return redirect()->back()->with('success', 'User Updated successfully!');
//     } else {
//         return redirect()->back()->with('error', 'User Updation failed!');
//     }
// }


public function toggleFullAccess(Request $request)
    {
        // Validate incoming request data
        $validatedData = $request->validate([
            'full_access_enabled' => 'required|boolean',
            'id' => 'required|integer|exists:users,id', // Ensure ID exists in the users table
        ]);

        // Find the user by ID
        $user = User::find($validatedData['id']);
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Update the user's full access status (assuming a 'full_access' column)
        $user->has_admin_priviledges = $validatedData['full_access_enabled'];
        $user->save();

        // Return a success response
        return response()->json(['message' => 'Access updated successfully.']);
    }


public function toggleOTPAccess(Request $request)
    {
        // Validate incoming request data
        $validatedData = $request->validate([
            'otp_enabled' => 'required|boolean',
            'id' => 'required|integer|exists:users,id', // Ensure ID exists in the users table
        ]);

        // Find the user by ID
        $user = User::find($validatedData['id']);
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Update the user's full access status (assuming a 'full_access' column)
        $user->otp_auth_enabled = $validatedData['otp_enabled'];
        $user->save();

        // Return a success response
        return response()->json(['message' => 'Authentication(2FA) updated successfully.']);
    }


public function edit($id)
{
    // Fetch the user with their company access data
    $user = User::with('companyAccess')->findOrFail($id);

    // Map the company access data to the desired structure
    $companiesAccess = $user->companyAccess->map(function ($access) {
        return [
            'company_id' => $access->company_id,
            'access_level' => $access->access_level,
        ];
    });

    // Check if the authenticated user is an admin
    if (Auth::user()->is_admin) {
        // If the user is an admin, fetch all companies
        $allCompanies = Company::all();
    } else {


        // If the authenticated user is not an admin, fetch only the companies assigned to the authenticated user
        $authUserCompanies = Auth::user()->companyAccess->pluck('company_id');
        $allCompanies = Company::whereIn('id', $authUserCompanies)->get();
    }

    // Return the view with the necessary data
    return view('edit_user', compact('user', 'companiesAccess', 'allCompanies'));
}







}
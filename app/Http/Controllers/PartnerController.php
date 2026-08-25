<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Partner; // Import your Partner model
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Models\CompanyAssignment;


class PartnerController extends Controller
{

  

public function searchPartners(Request $request)
    {
        $query = $request->get('query');

        // Adjust the query as per your model structure
        $partners = Partner::where('name', 'LIKE', '%' . $query . '%')
            ->get(['id', 'name', 'balance']); // Add any other fields you need

        return response()->json($partners);
    }





 public function updatePartner(Request $request)
{
    // Validate the incoming request
    $validatedData = $request->validate([
        'id' => 'required|exists:partners,uuid',
        'name' => 'required|string|max:255',
    ]);

    try {
        // Check if another partner already has the same name
        $existingPartner = Partner::where('name', $validatedData['name'])
            ->where('uuid', '!=', $validatedData['id']) // Exclude the current partner being updated
            ->first();

        if ($existingPartner) {
            return response()->json(['error' => 'Another partner with the same name already exists.'], 409);
        }

        // Find the partner by UUID
        $partner = Partner::where('uuid', $validatedData['id'])->first();

        // Update the name field
        $partner->name = $validatedData['name'];
        $partner->save();

        return response()->json(['success' => 'Partner updated successfully.'], 200);

    } catch (\Exception $e) {
        return response()->json(['error' => 'Something went wrong.'], 500);
    }
}



        public function inactivePartner(Request $request)
    {
        // Validate the incoming request
        $validatedData = $request->validate([
            'id' => 'required|exists:partners,uuid',
           
        ]);

        try {
            // Find the partner by UUID
            $partner = Partner::where('uuid',$validatedData['id'])->first();

            // Update the name field
            $partner->still_active = 0;
            $partner->save();

            return response()->json(['success' => 'Partner inactive successfully.'], 200);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Something went wrong.'], 500);
        }
    }


        public function activePartner(Request $request)
    {
        // Validate the incoming request
        $validatedData = $request->validate([
            'id' => 'required|exists:partners,uuid',
           
        ]);

        try {
            // Find the partner by UUID
            $partner = Partner::where('uuid',$validatedData['id'])->first();

            // Update the name field
            $partner->still_active = 1;
            $partner->save();

            return response()->json(['success' => 'Partner active successfully.'], 200);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Something went wrong.'], 500);
        }
    }



    public function store(Request $request)
{
    // Retrieve form data and validate
    $validated = $request->validate([
        'company_id' => 'required',
        'partner_name' => 'required|max:255',
    ]);

    

    // Check if the partner name already exists for the given company
    $exists = DB::table('partners as p')
        ->join('company_assignments as ca', 'p.uuid', '=', 'ca.partner_id')
        ->where('p.name', $validated['partner_name'])
        ->where('ca.company_id', $validated['company_id'])
        ->exists();

    if ($exists) {
        return response()->json(['error' => 'User name already exists in this company.'], 409);
    }

    // Create a new partner and assign to company
    $partner = Partner::create([
        'uuid' => (string) Str::uuid(),
        'name' => $validated['partner_name'],
        'balance' => 0,
        'still_active' => 1,
    ]);

    // Assign partner to the company
    CompanyAssignment::create([
        'partner_id' => $partner->uuid,
        'company_id' => $validated['company_id'],
        'timestamp' => now()->timestamp,
    ]);

    return response()->json(['success' => 'Partner added successfully and assigned to company.']);
}



}

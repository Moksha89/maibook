<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use App\Models\Company; // Assuming you have a Company model
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function uploadLogo(Request $request)
    {
        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg|max:2048' // 2MB max size
        ]);

        try {
            // Process and store the logo
            if ($request->file('logo')) {
                // Create a unique name for the logo file
                $logoName = time() . '_' . $request->file('logo')->getClientOriginalName();

                // Move the uploaded file to the public/logos directory
                $path = $request->file('logo')->move(public_path('logos'), $logoName);

                // Update the logo path in the database
                $update = DB::table('logo')->where('id', 1)->update(['logo' => 'logos/' . $logoName]);

                // Return success response with the new logo URL
                return response()->json([
                    'success' => true,
                    'logo_url' => asset('logos/' . $logoName) // Using asset to generate the URL
                ], 200);
            }

            return response()->json(['error' => 'Invalid file upload.'], 400);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Something went wrong.'], 500);
        }
    }
}

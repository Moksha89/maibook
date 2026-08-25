<?php

namespace App\Http\Controllers;

use App\Models\BackupEmail;
use Illuminate\Http\Request;

class BackupEmailController extends Controller
{
    // Display a listing of the resource
    public function index()
    {
        $emails = BackupEmail::all();
        return view('backup_emails.index', compact('emails'));
    }

    // Show the form for creating a new resource
    public function create()
    {
        return view('backup_emails.create');
    }

    // Store a newly created resource in storage
    public function store(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        BackupEmail::create([
            'email' => $request->email,
            'date_time' => now(),
        ]);

        return redirect()->route('backup-emails.index')->with('success', 'Email added successfully!');
    }

    // Display the specified resource
    public function show(BackupEmail $backupEmail)
    {
        return view('backup_emails.show', compact('backupEmail'));
    }

    // Show the form for editing the specified resource
    public function edit(BackupEmail $backupEmail)
    {
        return view('backup_emails.edit', compact('backupEmail'));
    }

    // Update the specified resource in storage
    public function update(Request $request, BackupEmail $backupEmail)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $backupEmail->update([
            'email' => $request->email,
        ]);

        return redirect()->route('backup-emails.index')->with('success', 'Email updated successfully!');
    }

    // Remove the specified resource from storage
    public function destroy(BackupEmail $backupEmail)
    {
        $backupEmail->delete();
        return redirect()->route('backup-emails.index')->with('success', 'Email deleted successfully!');
    }
}

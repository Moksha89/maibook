@extends('admin.layouts.admin')

@section('content')
<div>
    <h2>Backup Email Details</h2>
    <p>ID: {{ $backupEmail->id }}</p>
    <p>Email: {{ $backupEmail->email }}</p>
    <p>Date/Time: {{ $backupEmail->date_time }}</p>
</div>
@endsection

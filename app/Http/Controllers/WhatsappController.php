<?php

namespace App\Http\Controllers;

use App\Services\WhatsappResult;
use App\Services\WhatsappService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WhatsappController extends Controller
{
    public function __construct(private readonly WhatsappService $whatsapp)
    {
    }

    public function settings()
    {
        return view('whatsapp.settings');
    }

    public function status(): JsonResponse
    {
        return $this->serviceResponse($this->whatsapp->status());
    }

    public function login(): JsonResponse
    {
        return $this->serviceResponse($this->whatsapp->login());
    }

    public function logout(): JsonResponse
    {
        return $this->serviceResponse($this->whatsapp->logout());
    }

    public function sendReport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'to' => ['required', 'string', 'regex:/^\+?\d{8,15}$/'],
            'format' => ['required', 'in:text,image,both'],
            'text' => ['nullable', 'string', 'required_unless:format,image'],
            'image' => [
                'nullable',
                'string',
                'required_unless:format,text',
                'regex:~^data:image/png;base64,[A-Za-z0-9+/]+={0,2}$~',
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Please provide a valid recipient and report format.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();
        $imageBase64 = null;

        if (!empty($validated['image'])) {
            $imageBase64 = substr($validated['image'], strlen('data:image/png;base64,'));
            $decoded = base64_decode($imageBase64, true);

            if ($decoded === false || strlen($decoded) > 5 * 1024 * 1024) {
                return response()->json([
                    'message' => 'The report image is too large or invalid.',
                ], 422);
            }
        }

        $recipient = ltrim($validated['to'], '+');
        $result = $this->whatsapp->send(
            $recipient,
            $validated['text'] ?? null,
            $imageBase64,
            'Maibook report'
        );

        return $this->serviceResponse($result, 'Report sent to WhatsApp.');
    }

    private function serviceResponse(WhatsappResult $result, ?string $successMessage = null): JsonResponse
    {
        if (!$result->successful) {
            return response()->json([
                'message' => $result->message ?? 'WhatsApp is unavailable right now.',
            ], $result->status);
        }

        $data = $result->data;
        if ($successMessage !== null) {
            $data['message'] = $successMessage;
        }

        return response()->json($data, $result->status);
    }
}

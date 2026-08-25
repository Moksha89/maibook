<?php

namespace App\Services;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsappService
{
    public function status(): WhatsappResult
    {
        return $this->request('status', 'get', '/status', [], 5);
    }

    public function login(): WhatsappResult
    {
        return $this->request('login', 'post', '/login', [], 5);
    }

    public function logout(): WhatsappResult
    {
        return $this->request('logout', 'post', '/logout', [], 5);
    }

    public function send(
        string $to,
        ?string $text,
        ?string $imageBase64,
        ?string $caption
    ): WhatsappResult {
        return $this->request('send', 'post', '/send', [
            'to' => $to,
            'text' => $text,
            'imageBase64' => $imageBase64,
            'caption' => $caption,
        ], 30);
    }

    private function request(
        string $operation,
        string $method,
        string $path,
        array $payload,
        int $timeout
    ): WhatsappResult {
        $url = rtrim((string) config('services.whatsapp.url'), '/') . $path;

        try {
            $request = Http::timeout($timeout)
                ->withHeaders(['X-Bridge-Token' => (string) config('services.whatsapp.token')]);

            /** @var Response $response */
            $response = $method === 'get'
                ? $request->get($url)
                : $request->post($url, $payload);
        } catch (ConnectionException $exception) {
            Log::error('WhatsApp bridge connection failed.', [
                'operation' => $operation,
                'exception' => get_class($exception),
            ]);

            return WhatsappResult::failure('WhatsApp is unavailable right now.');
        } catch (\Throwable $exception) {
            Log::error('WhatsApp bridge request failed.', [
                'operation' => $operation,
                'exception' => get_class($exception),
            ]);

            return WhatsappResult::failure('WhatsApp is unavailable right now.');
        }

        if (!$response->successful()) {
            return WhatsappResult::failure(
                $response->status() === 503
                    ? 'WhatsApp is not connected. Connect WhatsApp in the WhatsApp settings first.'
                    : 'WhatsApp is unavailable right now.',
                $response->status() >= 400 && $response->status() < 600 ? $response->status() : 503
            );
        }

        $data = $response->json();
        return is_array($data)
            ? WhatsappResult::success($data, $response->status())
            : WhatsappResult::failure('WhatsApp returned an invalid response.');
    }
}

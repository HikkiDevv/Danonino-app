package com.danonino.app;

import android.app.Activity;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.ServiceConnection;
import android.media.projection.MediaProjectionManager;
import android.os.IBinder;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "ScreenCapture")
public class ScreenCapturePlugin extends Plugin {
    private ScreenCaptureService captureService;
    private boolean isBound = false;
    private PluginCall pendingStartCall;

    private final ServiceConnection serviceConnection = new ServiceConnection() {
        @Override
        public void onServiceConnected(ComponentName className, IBinder service) {
            ScreenCaptureService.LocalBinder binder = (ScreenCaptureService.LocalBinder) service;
            captureService = binder.getService();
            isBound = true;
        }

        @Override
        public void onServiceDisconnected(ComponentName arg0) {
            captureService = null;
            isBound = false;
        }
    };

    @PluginMethod
    public void startCapture(PluginCall call) {
        MediaProjectionManager mpm = (MediaProjectionManager) getContext().getSystemService(Context.MEDIA_PROJECTION_SERVICE);
        if (mpm == null) {
            call.reject("MediaProjectionManager no disponible en este dispositivo");
            return;
        }

        pendingStartCall = call;
        Intent captureIntent = mpm.createScreenCaptureIntent();
        startActivityForResult(call, captureIntent, "handleCaptureIntentResult");
    }

    @ActivityCallback
    private void handleCaptureIntentResult(PluginCall call, ActivityResult result) {
        if (call == null) call = pendingStartCall;

        if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
            Intent serviceIntent = new Intent(getContext(), ScreenCaptureService.class);
            getContext().startService(serviceIntent);
            getContext().bindService(serviceIntent, serviceConnection, Context.BIND_AUTO_CREATE);

            // Iniciar proyección en el servicio tras breve retardo de enlace
            final int resultCode = result.getResultCode();
            final Intent resultData = result.getData();

            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(new Runnable() {
                @Override
                public void run() {
                    if (captureService != null) {
                        captureService.startProjection(resultCode, resultData);
                    }
                }
            }, 300);

            JSObject ret = new JSObject();
            ret.put("success", true);
            if (call != null) {
                call.resolve(ret);
            }
        } else {
            if (call != null) {
                call.reject("El usuario canceló la captura de pantalla");
            }
        }
        pendingStartCall = null;
    }

    @PluginMethod
    public void getFrame(PluginCall call) {
        if (captureService != null) {
            String frame = captureService.captureFrameBase64();
            JSObject ret = new JSObject();
            ret.put("frame", frame);
            call.resolve(ret);
        } else {
            JSObject ret = new JSObject();
            ret.put("frame", null);
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void stopCapture(PluginCall call) {
        if (isBound) {
            if (captureService != null) {
                captureService.stopProjection();
            }
            getContext().unbindService(serviceConnection);
            isBound = false;
            captureService = null;
        }
        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }

    @Override
    protected void handleOnDestroy() {
        if (isBound) {
            if (captureService != null) {
                captureService.stopProjection();
            }
            getContext().unbindService(serviceConnection);
            isBound = false;
        }
        super.handleOnDestroy();
    }
}

package com.danonino.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Bitmap;
import android.graphics.PixelFormat;
import android.hardware.display.DisplayManager;
import android.hardware.display.VirtualDisplay;
import android.media.Image;
import android.media.ImageReader;
import android.media.projection.MediaProjection;
import android.media.projection.MediaProjectionManager;
import android.os.Binder;
import android.os.Build;
import android.os.IBinder;
import android.util.Base64;
import android.util.DisplayMetrics;
import android.view.WindowManager;

import androidx.core.app.NotificationCompat;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

public class ScreenCaptureService extends Service {
    private static final String CHANNEL_ID = "danonino_screen_capture";
    private static final int NOTIFICATION_ID = 8769;

    private MediaProjection mediaProjection;
    private VirtualDisplay virtualDisplay;
    private ImageReader imageReader;
    private int screenWidth = 720;
    private int screenHeight = 1280;
    private int screenDensity = DisplayMetrics.DENSITY_DEFAULT;

    private final IBinder binder = new LocalBinder();

    public class LocalBinder extends Binder {
        public ScreenCaptureService getService() {
            return ScreenCaptureService.this;
        }
    }

    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Danonino Compartir Pantalla",
                    NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Indicador visible mientras la pantalla de Android está compartida con Danonino");
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    public void startProjection(int resultCode, Intent resultData) {
        Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setContentTitle("Danonino Live")
                .setContentText("Compartiendo pantalla con Danonino en tiempo real")
                .setSmallIcon(android.R.drawable.ic_menu_camera)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setOngoing(true)
                .build();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION);
        } else {
            startForeground(NOTIFICATION_ID, notification);
        }

        WindowManager wm = (WindowManager) getSystemService(Context.WINDOW_SERVICE);
        if (wm != null) {
            DisplayMetrics metrics = new DisplayMetrics();
            wm.getDefaultDisplay().getRealMetrics(metrics);
            screenDensity = metrics.densityDpi;
            // Escalar a máximo 720p para balancear nitidez y rendimiento
            int rawW = metrics.widthPixels;
            int rawH = metrics.heightPixels;
            if (rawW > 720) {
                float ratio = 720f / rawW;
                screenWidth = 720;
                screenHeight = (int) (rawH * ratio);
            } else {
                screenWidth = rawW;
                screenHeight = rawH;
            }
        }

        MediaProjectionManager mpm = (MediaProjectionManager) getSystemService(Context.MEDIA_PROJECTION_SERVICE);
        if (mpm != null) {
            mediaProjection = mpm.getMediaProjection(resultCode, resultData);
            if (mediaProjection != null) {
                imageReader = ImageReader.newInstance(screenWidth, screenHeight, PixelFormat.RGBA_8888, 2);
                virtualDisplay = mediaProjection.createVirtualDisplay(
                        "DanoninoLiveCapture",
                        screenWidth,
                        screenHeight,
                        screenDensity,
                        DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
                        imageReader.getSurface(),
                        null,
                        null
                );
            }
        }
    }

    public String captureFrameBase64() {
        if (imageReader == null) return null;

        Image image = null;
        try {
            image = imageReader.acquireLatestImage();
            if (image == null) return null;

            Image.Plane[] planes = image.getPlanes();
            ByteBuffer buffer = planes[0].getBuffer();
            int pixelStride = planes[0].getPixelStride();
            int rowStride = planes[0].getRowStride();
            int rowPadding = rowStride - pixelStride * screenWidth;

            Bitmap bitmap = Bitmap.createBitmap(
                    screenWidth + rowPadding / pixelStride,
                    screenHeight,
                    Bitmap.Config.ARGB_8888
            );
            bitmap.copyPixelsFromBuffer(buffer);

            // Recortar si había rowPadding
            Bitmap cleanBitmap = Bitmap.createBitmap(bitmap, 0, 0, screenWidth, screenHeight);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            cleanBitmap.compress(Bitmap.CompressFormat.JPEG, 65, baos);
            byte[] bytes = baos.toByteArray();

            cleanBitmap.recycle();
            bitmap.recycle();

            return "data:image/jpeg;base64," + Base64.encodeToString(bytes, Base64.NO_WRAP);
        } catch (Exception e) {
            return null;
        } finally {
            if (image != null) {
                image.close();
            }
        }
    }

    public void stopProjection() {
        if (virtualDisplay != null) {
            virtualDisplay.release();
            virtualDisplay = null;
        }
        if (imageReader != null) {
            imageReader.close();
            imageReader = null;
        }
        if (mediaProjection != null) {
            mediaProjection.stop();
            mediaProjection = null;
        }
        stopForeground(true);
        stopSelf();
    }

    @Override
    public void onDestroy() {
        stopProjection();
        super.onDestroy();
    }
}

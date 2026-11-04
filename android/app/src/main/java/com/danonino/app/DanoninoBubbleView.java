package com.danonino.app;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.RectF;
import android.view.View;

public class DanoninoBubbleView extends View {
    private final Paint bgPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint borderPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint eyePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint glowPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint statusDotPaint = new Paint(Paint.ANTI_ALIAS_FLAG);

    public DanoninoBubbleView(Context context) {
        super(context);
        init();
    }

    private void init() {
        // Fondo azul profundo cósmico
        bgPaint.setColor(Color.parseColor("#0f172a"));
        bgPaint.setStyle(Paint.Style.FILL);

        // Borde cian brillante
        borderPaint.setColor(Color.parseColor("#06b6d4"));
        borderPaint.setStyle(Paint.Style.STROKE);
        borderPaint.setStrokeWidth(6f);

        // Ojos de Danonino estilo IA
        eyePaint.setColor(Color.parseColor("#a855f7"));
        eyePaint.setStyle(Paint.Style.FILL);

        // Brillo cian
        glowPaint.setColor(Color.parseColor("#22d3ee"));
        glowPaint.setStyle(Paint.Style.FILL);

        // Punto de estado verde en vivo
        statusDotPaint.setColor(Color.parseColor("#10b981"));
        statusDotPaint.setStyle(Paint.Style.FILL);
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int size = (int) (64 * getResources().getDisplayMetrics().density);
        setMeasuredDimension(size, size);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        super.onDraw(canvas);
        float w = getWidth();
        float h = getHeight();
        float radius = Math.min(w, h) / 2f - 8f;
        float cx = w / 2f;
        float cy = h / 2f;

        // Fondo circular
        canvas.drawCircle(cx, cy, radius, bgPaint);

        // Borde exterior
        canvas.drawCircle(cx, cy, radius, borderPaint);

        // Ojos de Danonino (expresión curiosa y amable)
        float eyeSpacing = radius * 0.35f;
        float eyeY = cy - radius * 0.08f;
        float eyeRadius = radius * 0.16f;

        canvas.drawCircle(cx - eyeSpacing, eyeY, eyeRadius, eyePaint);
        canvas.drawCircle(cx + eyeSpacing, eyeY, eyeRadius, eyePaint);

        // Brillo en los ojos
        canvas.drawCircle(cx - eyeSpacing + 2f, eyeY - 2f, eyeRadius * 0.4f, glowPaint);
        canvas.drawCircle(cx + eyeSpacing + 2f, eyeY - 2f, eyeRadius * 0.4f, glowPaint);

        // Sonrisa sutil de IA
        Paint smilePaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        smilePaint.setColor(Color.parseColor("#38bdf8"));
        smilePaint.setStyle(Paint.Style.STROKE);
        smilePaint.setStrokeWidth(3.5f);
        smilePaint.setStrokeCap(Paint.Cap.ROUND);
        RectF smileRect = new RectF(cx - radius * 0.25f, cy + radius * 0.05f, cx + radius * 0.25f, cy + radius * 0.35f);
        canvas.drawArc(smileRect, 20, 140, false, smilePaint);

        // Punto de estado en vivo (esquina superior derecha)
        canvas.drawCircle(w - 12f, 12f, 7f, statusDotPaint);
    }
}

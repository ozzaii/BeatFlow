#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <vector>
#include <cmath>

using namespace emscripten;

// SIMD-optimized audio processing
#include <wasm_simd128.h>

class AudioProcessor {
private:
    // Processing buffers
    float* inputBuffer;
    float* outputBuffer;
    size_t bufferSize;
    
    // Effect parameters
    struct EffectParams {
        float drive = 1.0f;
        float mix = 1.0f;
        float feedback = 0.0f;
        float rate = 1.0f;
        float depth = 0.5f;
    } params;

    // State variables
    float phase = 0.0f;
    std::vector<float> delayLine;
    size_t delayIndex = 0;

public:
    AudioProcessor(size_t size) : bufferSize(size) {
        inputBuffer = new float[size];
        outputBuffer = new float[size];
        delayLine.resize(size * 2, 0.0f); // 2 seconds max delay
    }

    ~AudioProcessor() {
        delete[] inputBuffer;
        delete[] outputBuffer;
    }

    // SIMD-optimized saturation
    void saturate(float* input, float* output, size_t length, float drive) {
        // Process 4 samples at once using SIMD
        for (size_t i = 0; i < length; i += 4) {
            v128_t in = wasm_v128_load(input + i);
            v128_t driven = wasm_f32x4_mul(in, wasm_f32x4_splat(drive));
            v128_t saturated = wasm_f32x4_div(
                wasm_f32x4_mul(
                    driven,
                    wasm_f32x4_sqrt(
                        wasm_f32x4_add(
                            wasm_f32x4_const(1.0f),
                            wasm_f32x4_mul(driven, driven)
                        )
                    )
                ),
                wasm_f32x4_add(
                    wasm_f32x4_const(1.0f),
                    wasm_f32x4_mul(driven, driven)
                )
            );
            wasm_v128_store(output + i, saturated);
        }
    }

    // High-quality delay with interpolation
    void delay(float* input, float* output, size_t length, float time, float feedback) {
        const float delayTime = time * bufferSize;
        
        for (size_t i = 0; i < length; i++) {
            // Write to delay line
            delayLine[delayIndex] = input[i] + delayLine[(delayIndex - 
                static_cast<size_t>(delayTime) + delayLine.size()) % delayLine.size()] * feedback;
            
            // Read from delay line with linear interpolation
            const float readPos = delayIndex - delayTime;
            const size_t readIndex1 = (static_cast<size_t>(readPos) + delayLine.size()) % delayLine.size();
            const size_t readIndex2 = (readIndex1 + 1) % delayLine.size();
            const float frac = readPos - std::floor(readPos);
            
            output[i] = delayLine[readIndex1] * (1.0f - frac) + delayLine[readIndex2] * frac;
            
            delayIndex = (delayIndex + 1) % delayLine.size();
        }
    }

    // Modulation effects (chorus/phaser)
    void modulate(float* input, float* output, size_t length, float rate, float depth) {
        const float twoPi = 6.28318530718f;
        
        for (size_t i = 0; i < length; i++) {
            // LFO
            const float lfo = std::sin(phase) * depth;
            phase += rate * twoPi / bufferSize;
            if (phase >= twoPi) phase -= twoPi;
            
            // Apply modulation
            const float delayTime = (1.0f + lfo) * 20.0f; // 20ms base delay
            const float readPos = delayIndex - delayTime;
            const size_t readIndex1 = (static_cast<size_t>(readPos) + delayLine.size()) % delayLine.size();
            const size_t readIndex2 = (readIndex1 + 1) % delayLine.size();
            const float frac = readPos - std::floor(readPos);
            
            delayLine[delayIndex] = input[i];
            output[i] = delayLine[readIndex1] * (1.0f - frac) + delayLine[readIndex2] * frac;
            
            delayIndex = (delayIndex + 1) % delayLine.size();
        }
    }

    // Main processing function
    void process(val inputArray, val outputArray) {
        // Copy input to C++ buffer
        size_t length = std::min(
            inputArray["length"].as<size_t>(),
            bufferSize
        );
        
        // Use SIMD to copy input
        for (size_t i = 0; i < length; i += 4) {
            v128_t in = wasm_v128_load(reinterpret_cast<float*>(inputArray["buffer"].as<size_t>() + i * 4));
            wasm_v128_store(inputBuffer + i, in);
        }

        // Apply effects chain
        saturate(inputBuffer, outputBuffer, length, params.drive);
        delay(outputBuffer, outputBuffer, length, 0.25f, params.feedback);
        modulate(outputBuffer, outputBuffer, length, params.rate, params.depth);

        // Mix with dry signal
        for (size_t i = 0; i < length; i += 4) {
            v128_t dry = wasm_v128_load(inputBuffer + i);
            v128_t wet = wasm_v128_load(outputBuffer + i);
            v128_t mixed = wasm_f32x4_add(
                wasm_f32x4_mul(dry, wasm_f32x4_splat(1.0f - params.mix)),
                wasm_f32x4_mul(wet, wasm_f32x4_splat(params.mix))
            );
            wasm_v128_store(reinterpret_cast<float*>(outputArray["buffer"].as<size_t>() + i * 4), mixed);
        }
    }

    // Parameter setters
    void setDrive(float value) { params.drive = value; }
    void setMix(float value) { params.mix = value; }
    void setFeedback(float value) { params.feedback = value; }
    void setRate(float value) { params.rate = value; }
    void setDepth(float value) { params.depth = value; }
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(audio_processor) {
    class_<AudioProcessor>("AudioProcessor")
        .constructor<size_t>()
        .function("process", &AudioProcessor::process)
        .function("setDrive", &AudioProcessor::setDrive)
        .function("setMix", &AudioProcessor::setMix)
        .function("setFeedback", &AudioProcessor::setFeedback)
        .function("setRate", &AudioProcessor::setRate)
        .function("setDepth", &AudioProcessor::setDepth);
} 
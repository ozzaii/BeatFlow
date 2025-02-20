use wasm_bindgen::prelude::*;
use web_sys::{AudioContext, OscillatorNode, GainNode};
use js_sys::{Float32Array, Array};
use std::f32::consts::PI;

#[wasm_bindgen]
pub struct AudioProcessor {
    context: AudioContext,
    oscillator: Option<OscillatorNode>,
    gain: GainNode,
}

#[wasm_bindgen]
impl AudioProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Result<AudioProcessor, JsValue> {
        console_error_panic_hook::set_once();
        
        let context = AudioContext::new()?;
        let gain = context.create_gain()?;
        gain.connect_with_audio_node(&context.destination())?;
        
        Ok(AudioProcessor {
            context,
            oscillator: None,
            gain,
        })
    }

    pub fn start(&mut self) -> Result<(), JsValue> {
        let oscillator = self.context.create_oscillator()?;
        oscillator.connect_with_audio_node(&self.gain)?;
        oscillator.start()?;
        self.oscillator = Some(oscillator);
        Ok(())
    }

    pub fn stop(&mut self) -> Result<(), JsValue> {
        if let Some(osc) = self.oscillator.take() {
            osc.stop()?;
        }
        Ok(())
    }

    pub fn set_gain(&self, value: f32) {
        self.gain.gain().set_value(value);
    }

    pub fn process_buffer(&self, input: &Float32Array) -> Float32Array {
        let len = input.length() as usize;
        let mut output = Float32Array::new_with_length(len as u32);
        
        for i in 0..len {
            let sample = input.get_index(i as u32);
            // Apply some basic processing (e.g., soft clipping)
            let processed = (sample * PI).tanh();
            output.set_index(i as u32, processed);
        }
        
        output
    }
}

#[wasm_bindgen]
pub fn init_panic_hook() {
    console_error_panic_hook::set_once();
}

pub fn add(left: u64, right: u64) -> u64 {
    left + right
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn it_works() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }
}

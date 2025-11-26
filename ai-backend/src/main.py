import torch
import numpy as np
import sounddevice as sd
import soundfile as sf
import transformers
from transformers import Qwen3OmniMoeForConditionalGeneration as Q3M
from transformers import Qwen3OmniMoeProcessor as Q3P
from qwen_omni_utils import process_mm_info
import screenshot

SR_UV, SR_QW, THRESH = 16000, 24000, 0.1
DEV = "cuda"

uv = transformers.pipeline(
    model='fixie-ai/ultraVAD', trust_remote_code=True, device=DEV
)
qw = Q3M.from_pretrained(
    "Qwen/Qwen3-Omni-30B-A3B-Instruct", dtype="auto", device_map="auto",
    attn_implementation="flash_attention_2"
)
proc = Q3P.from_pretrained("Qwen/Qwen3-Omni-30B-A3B-Instruct")

hist = [{
    "role": "system",
    "content": "You are Qwen-Omni. Interact using short spoken language."
}]
buf = np.array([], dtype=np.float32)

print("Listening...")

while True:
    c = sd.rec(
        int(0.5 * SR_UV), samplerate=SR_UV, channels=1, dtype='float32',
        blocking=True
    ).flatten()
    buf = np.concatenate((buf, c))
    if len(buf) < SR_UV: continue

    in_dat = {"audio": buf, "turns": hist, "sampling_rate": SR_UV}
    m_in = uv.preprocess(in_dat)
    m_in = {k: (v.to(uv.device) if hasattr(v, "to") else v)
            for k, v in m_in.items()}

    with torch.inference_mode():
        out = uv.model.forward(**m_in, return_dict=True)

    st = m_in["audio_token_start_idx"].item()
    ln = m_in["audio_token_len"].item()
    eot = uv.tokenizer.convert_tokens_to_ids("<|eot_id|>")
    prob = torch.softmax(
        out.logits[0, int(st + ln - 1), :].float(), dim=-1
    )[eot].item()

    if prob > THRESH:
        sf.write("tmp.wav", buf, SR_UV)
        screenshot.get_png().save("tmp.png")

        u_msg = {
            "role": "user",
            "content": [
                {"type": "image", "image": "tmp.png"},
                {"type": "audio", "audio": "tmp.wav"},
                {"type": "text", "text": "Analyze this."}
            ]
        }

        msgs = [hist[0], u_msg]
        txt = proc.apply_chat_template(
            msgs, add_generation_prompt=True, tokenize=False
        )
        aud, img, vid = process_mm_info(msgs, use_audio_in_video=False)

        q_in = proc(
            text=txt, audio=aud, images=img, videos=vid, return_tensors="pt",
            padding=True, use_audio_in_video=False
        ).to(qw.device).to(qw.dtype)

        with torch.no_grad():
            ids, wav = qw.generate(
                **q_in, speaker="Ethan", thinker_return_dict_in_generate=True
            )

        res = proc.batch_decode(
            ids.sequences[:, q_in["input_ids"].shape[1]:],
            skip_special_tokens=True
        )[0]

        hist.append({"role": "user", "content": "Audio processed."})
        hist.append({"role": "assistant", "content": res})

        if wav is not None:
            sd.play(wav.reshape(-1).detach().cpu().numpy(),
                    samplerate=SR_QW, blocking=True)

        buf = np.array([], dtype=np.float32)

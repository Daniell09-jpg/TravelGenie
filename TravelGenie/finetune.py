from google import genai
from google.genai import types

client = genai.Client()

# Define the training dataset
training_dataset = types.TuningDataset(
    examples=[
        types.TuningExample(
            text_input=process.env.i
            output=process.env.o
        ),
    ],
)

# Create a tuning job
tuning_job = client.tunings.tune(
    base_model="models/gemini-2.5-flash-001-tuning",
    training_dataset=training_dataset,
)
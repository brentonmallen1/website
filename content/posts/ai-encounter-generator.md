+++
title = "AI RPG Encounter Generator: RAG Chain Tutorial"
slug = "ai-encounter-generator"
date = 2025-04-26T11:21:00-05:00
tags = ["llm","rag","ai","ttrpg","qdrant","langchain"]
category = ["ai"]
description = "An AI RPG encounter generator"
+++

## Intro

This is meant to be somewhat of a tutorial/demonstration on an approach to putting together a Retrieval Augmented Generation (RAG) chain with a fun application of using it to generate situation appropriate encounters for a tabletop role playing game (TTRPG). At the moment, and as presented here, a 'full encounter plan' isn't really generated as much as a list of suggested creatures from which a game master may choose to use an encounter. My hope is to use this use case as a motivator to explore learning and building more AI powered tools and agents.

If this sounds intersting to you, grab your D20 and roll a CON check to see if you'll be able to endure this!


## Prerequisites
Well, uh, before we get started... we need to cover the prerequisites and overall approach/architecture of what will 
be covered here. This approach takes advantage of the following dependencies and components:
- [langchain](https://python.langchain.com/docs/introduction/)
    - [langchain-ollama](https://python.langchain.com/docs/integrations/llms/ollama/)
    - [langchain-qdrant](https://python.langchain.com/docs/integrations/vectorstores/qdrant/)
- [Ollama](https://ollama.com)
    - Running locally on my M3 Max macbook pro, but this could be substituted for any other langchain-supported provider.
    - I prefer to run models locally for several reasons, either on my macbook or on my homelab server. If that's something you'd like to learn more about, let me know!
- [unstructured]()
    - This is for text data standardization
- [pandas](https://github.com/pandas-dev/pandas)
    - Used just to handle the structured data and manipulation, not necessary but convenient
 
Now, you can roll for CON!



```python
import pathlib
from pprint import pprint

from IPython.display import Markdown, display

import pandas as pd
from tqdm import tqdm
tqdm.pandas()

from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_ollama.llms import OllamaLLM
from langchain_huggingface import HuggingFaceEmbeddings

from unstructured.cleaners.core import clean

```

## Step 1: Setting up the Models

### LLM
At the heart of all of this will be the LLM of your choosing. I'm using an Ollama server running on this M3 Max machine with 128GB of unified RAM. A list of downloaded models by name can be pulled by running `!ollama list | tail -n +2 | awk '{print $1}'` (if using ollama locally), but in this case, the [gemma3:27b](https://ollama.com/library/gemma3:27b) model is being used.

_**Out of game**: The gemma3:12b model also produces good results and requires less memory. I've tried other, larger models as well such as deepseek-r1 (70b), llama3.3 (70b), and even mistral-large (123b) and they, didn't produce as compelling results especially for the computation time with the larger models. I'm a fan of the gemma3 model and have been using elsewhere._

### Embedding Model
Another model we'll need is an [embedding model](https://huggingface.co/blog/getting-started-with-embeddings). This model is a transformer that is used to encode text into embeddings that can then be stored in a vector database.  This is a crucial component to the RAG process because, by computing and storing these embeddings, we can do a symantic simlarity search to retrieve (R) data that's relavent to the context at the moment and use it to augment (A) the generated (G) response.  For now, the embedding model will just be setup, but it will be used later.



```python
def get_llm(model_name:str = 'gemma3:27b'):
    """A helper function to load the llm in case different models are going to be used"""
    return OllamaLLM(model=model_name)

```


```python
embedding_model_name = 'sentence-transformers/all-MiniLM-L6-v2'

model_kwargs = {'device': 'mps'}  # using the Apple metal gpu
encode_kwargs = {'normalize_embeddings': True}

embedding_model = HuggingFaceEmbeddings(
    model_name=embedding_model_name,
    model_kwargs=model_kwargs,
    encode_kwargs=encode_kwargs
)

max_embed_length = embedding_model._client._modules['0'].max_seq_length
print(f'Max sequence length: {max_embed_length} tokens')

```

    Max sequence length: 256 tokens


## Step 2: Generate Creature Data

First piece of data we need is a set of creatures that will be available to choose from. The data used here was collected by simply scraping this [creature table](https://donjon.bin.sh/5e/monsters/).  The scraping process is out out of scope here, but the resulting data can be loaded into a pandas dataframe for use.



```python
creature_df = pd.read_csv('data/monster-table.csv')
print(f'There are {creature_df.shape[0]:,} creatures in the table')

creature_df.head()

```

    There are 697 creatures in the table





<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>name</th>
      <th>size</th>
      <th>type</th>
      <th>tags</th>
      <th>alignment</th>
      <th>challenge</th>
      <th>xp</th>
      <th>source</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>Frog</td>
      <td>Tiny</td>
      <td>Beast</td>
      <td>NaN</td>
      <td>Unaligned</td>
      <td>0</td>
      <td>0</td>
      <td>mm 322</td>
    </tr>
    <tr>
      <th>1</th>
      <td>Sea Horse</td>
      <td>Tiny</td>
      <td>Beast</td>
      <td>NaN</td>
      <td>Unaligned</td>
      <td>0</td>
      <td>0</td>
      <td>mm 337</td>
    </tr>
    <tr>
      <th>2</th>
      <td>Awakened Shrub</td>
      <td>Small</td>
      <td>Plant</td>
      <td>NaN</td>
      <td>Unaligned</td>
      <td>0</td>
      <td>10</td>
      <td>mm 317</td>
    </tr>
    <tr>
      <th>3</th>
      <td>Baboon</td>
      <td>Small</td>
      <td>Beast</td>
      <td>NaN</td>
      <td>Unaligned</td>
      <td>0</td>
      <td>10</td>
      <td>mm 318</td>
    </tr>
    <tr>
      <th>4</th>
      <td>Badger</td>
      <td>Tiny</td>
      <td>Beast</td>
      <td>NaN</td>
      <td>Unaligned</td>
      <td>0</td>
      <td>10</td>
      <td>mm 318</td>
    </tr>
  </tbody>
</table>
</div>



### Generating Creature Descriptions

Having a list of the available creatures doesn't really provide much in terms of trying to figure out which should be used in the moment.  For this, it would be more useful to have some description of each creature for the semantic search process.

Descriptions for each creature could potentially be acquired through more web scraping, or access to some data, but that's a lot of extra work. One neat thing that can be done here is using the LLM to generate the descriptions for us. The model will have been exposed to, and accumulated more perspective, on the subject than could be done, practically, here - at least for this small exploration.

A prompt can be considerately crafted to generate the descriptions that best suit our needs.



```python
creature_desc_llm = get_llm()
creature_description_prompt = PromptTemplate.from_template(
    """in plain text without any formatting, give me a brief, 250 words at most,
    description of the dungeons and dragons 5th edition creature, {creature_name},
    and when it might be good to use it in an encounter. Do not provide any stats
    or numbers, just description and suggestion of usage"""
)

```

_**Side Quest**_

Let's break down this prompt:
- `plain text without any formatting` response
    - This is to reduce the amount of preprocessing that would have to go into the reponse before passing it to the embedding model
- `250 words at most`
    - This is an attempt to keep the response to a number of words that is close the the max sequence length for the embedding model of choice.
        - This allows for the prompt to be information dense while also avoiding loosing information that would be lost as the embedding model would truncate the text that exceeds its max sequence length
        - Word count and token count aren't the same, but this is used simply as a mitigation to information loss. Token counts can be extracted and the description could be iterated upon, but that's extra work that isn't, at the moment, necessary
- `dungeons and dragons 5th edition creature, {creature_name},`
    - Specifying the context of where these creatures are getting pulled from and where they're to be used so that a description isn't provided that's confused with a similar creature by a similar name in a different context    
- `when it might be good to use it in an encounter`
    - As the intention is to provide scenario context at the time of encounter generation, it would be helpful to embed some of that perspective into the database for the given creature
- `Do not provide any stats or numbers, just description and suggestion of usage`
    - Mitigating any stats information that might be appropriately describing the creature, but not wanted for this case



Back to the main quest, let's generate an example description


```python
description_chain = creature_description_prompt | creature_desc_llm

def get_creature_description(creature_name, llm_chain=description_chain):
    description = llm_chain.invoke(
        {'creature_name': creature_name}
    )
    return clean(
        description,
        bullets=True,
        extra_whitespace=True,
        lowercase=True,
        dashes=True
    )
    
```


```python
%%time

sample_creature = creature_df.sample(1)['name'].values[0]
print(sample_creature)
print(get_creature_description(sample_creature))

```

    Amnizu
    the amnizu is a bizarre, unsettling creature from the feywild, appearing as a humanoid figure woven entirely from brambles, thorns, and flowering vines. it’s not truly alive in the traditional sense, but a construct animated by potent fey magic and a fragment of a lost, sorrowful dryad’s spirit. it moves with a jerky, unsettling grace, and constantly sheds petals and thorns. amnizu aren't inherently malicious, but deeply melancholic and lost. they wander seeking fragments of their lost dryad’s memories, often appearing near places of natural beauty that have been damaged or forgotten blighted groves, ruined shrines, or abandoned gardens. they aren’t aggressive unless disturbed or if they perceive a threat to the remnants of beauty they guard. an amnizu encounter works best as a mystery or a poignant side quest. perhaps the players stumble upon one guarding a forgotten grove and must uncover the story of the dryad to soothe its sorrow, or discover it’s been wrongly accused of harming the local wildlife. it's a good choice when you want an encounter that isn’t about combat, or where the solution lies in understanding and compassion rather than brute force. it adds a touch of tragic beauty and feywild weirdness to your campaign.
    CPU times: user 103 ms, sys: 18.6 ms, total: 122 ms
    Wall time: 16.8 s


Given that one description can take `20+ seconds`, and having around `700 creatures`, this process will take some time (`~4 hours`) with this setup. This is where commercial services or better hardware will help dramatically, but I'm not in a hurry so I left it to run and just made sure to save off the descriptions.  Those descriptions are read into a dataframe here, but i'll also show how this could be applied to the creature list.


```python
sample_creatures = creature_df.head(2)
sample_creatures.loc[:, 'description'] = sample_creatures.loc[:, 'name'].progress_apply(get_creature_description)
sample_creatures[['name', 'description']]

```

    100%|█████████████████████████████████████████████████████████████████████████████████████████████████████████| 2/2 [00:29<00:00, 14.59s/it]





<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>name</th>
      <th>description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>Frog</td>
      <td>the common frog is a small, unassuming amphibi...</td>
    </tr>
    <tr>
      <th>1</th>
      <td>Sea Horse</td>
      <td>the sea horse is a bizarre and beautiful creat...</td>
    </tr>
  </tbody>
</table>
</div>



Now loading the full description set



```python
creature_df = pd.read_csv('data/monster-table-wdesc-gemma3-27b.csv')
print(f'There are {creature_df.shape[0]:,} creatures in the table')
creature_df.head(3)

```

    There are 697 creatures in the table





<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>name</th>
      <th>size</th>
      <th>type</th>
      <th>tags</th>
      <th>alignment</th>
      <th>challenge</th>
      <th>xp</th>
      <th>source</th>
      <th>description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>Frog</td>
      <td>Tiny</td>
      <td>Beast</td>
      <td>NaN</td>
      <td>Unaligned</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>mm 322</td>
      <td>the common frog, while seemingly innocuous, is...</td>
    </tr>
    <tr>
      <th>1</th>
      <td>Sea Horse</td>
      <td>Tiny</td>
      <td>Beast</td>
      <td>NaN</td>
      <td>Unaligned</td>
      <td>0.0</td>
      <td>0.0</td>
      <td>mm 337</td>
      <td>the sea horse is a bizarre and beautiful creat...</td>
    </tr>
    <tr>
      <th>2</th>
      <td>Awakened Shrub</td>
      <td>Small</td>
      <td>Plant</td>
      <td>NaN</td>
      <td>Unaligned</td>
      <td>0.0</td>
      <td>10.0</td>
      <td>mm 317</td>
      <td>the awakened shrub appears as an unusually lar...</td>
    </tr>
  </tbody>
</table>
</div>



_**Side Quest**_

D&D has a concept of a `Challenge Rating` (CR) that goes into calculating appropriate difficulty of encounters and so we'll calculate that from the creature's XP to have available as metadata in the vector db.  This can be useful in the future for filtering.  For more information on CRs, consult the DMG.



```python
from fractions import Fraction

def fraction_to_float(frac: str):
    return float(Fraction(frac))

creature_df.loc[:, 'challenge'] = creature_df.loc[:, 'challenge'].apply(fraction_to_float)
creature_df.loc[:, 'xp'] = creature_df.loc[:, 'xp'].astype(float)

creature_df.tail(2)

```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>name</th>
      <th>size</th>
      <th>type</th>
      <th>tags</th>
      <th>alignment</th>
      <th>challenge</th>
      <th>xp</th>
      <th>source</th>
      <th>description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>695</th>
      <td>Marut</td>
      <td>Large</td>
      <td>Construct</td>
      <td>inevitable</td>
      <td>LN</td>
      <td>25.0</td>
      <td>75000.0</td>
      <td>motm 173, mtf 213</td>
      <td>maruts are celestial guardians, towering human...</td>
    </tr>
    <tr>
      <th>696</th>
      <td>Tarrasque</td>
      <td>Gargantuan</td>
      <td>Monstrosity</td>
      <td>titan</td>
      <td>Unaligned</td>
      <td>30.0</td>
      <td>155000.0</td>
      <td>mm 286</td>
      <td>the tarrasque is a legendary, nigh unstoppable...</td>
    </tr>
  </tbody>
</table>
</div>



## Step 3: Vector Database
Now that we have our creature data collected, we'll want to first encode the descriptions and then store each of the creatures into the vector database.

Here we're using [Qdrant](https://qdrant.tech) as our vector database. Why? Because I like it. It's straightforward to implement, it's containerized, and can be self-hosted (which is inline with my proclivity for running things on my homelab and using local LLMs).

Things to note:
- Here, the database will be stored in a local db file, but it could also be stored in memory, in the cloud, or even self-hosted on another machine
- The database is populated using the [DataFrameLoader](https://python.langchain.com/api_reference/community/document_loaders/langchain_community.document_loaders.dataframe.DataFrameLoader.html) object from the `langchain_community` module. This is part of the convenience I mentioned with using pandas



```python
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient, models
from langchain_community.document_loaders import DataFrameLoader

```


```python
creature_docs = DataFrameLoader(
    creature_df,
    page_content_column='description',
)

```

The loader is used to generate [langchain Documents](https://python.langchain.com/api_reference/core/documents/langchain_core.documents.base.Document.html) from each row of the dataframe. It is called upon as a pipeline to load the data into the database, and can even lazy load for larger data cases.  The `page_content_column` kwarg specifies which column in the dataframe should be used for the encoding.

Here's an example of loading a single row and what the document object output looks like



```python
sample_doc = next(creature_docs.lazy_load())
sample_doc

```




    Document(metadata={'name': 'Frog', 'size': 'Tiny', 'type': 'Beast', 'tags': nan, 'alignment': 'Unaligned', 'challenge': 0.0, 'xp': 0.0, 'source': 'mm 322'}, page_content="the common frog, while seemingly innocuous, is a surprisingly versatile creature in dungeons & dragons. these amphibians are generally small, green or brown, and inhabit damp environments like swamps, marshes, and near bodies of water. they appear largely as normal frogs would, blending easily into their surroundings. however, some frogs possess a potent, poisonous coating on their skin. these aren't monsters meant to be *defeated* so much as overcome. a single frog isn’t a threat, but a swarm can present a slippery, mildly hazardous obstacle, particularly in a chase or escape sequence. consider a field absolutely *covered* in them, forcing characters to carefully navigate or risk falling and potentially being affected by the mild toxins. they’re excellent environmental storytelling pieces. a sudden silence in a swamp, broken only by croaking, could signal something larger approaching. a large number of dead frogs might indicate a magical pollution or a creature preying on them. frogs are best used as a minor complication or puzzle element, rather than a direct combat encounter. they suit early level adventures, providing a bit of flavor and challenge without being overwhelming. they can also be incorporated into a larger encounter perhaps a hag's familiar, or guardians of a hidden pathway.")




```python
sample_doc.model_dump().keys()

```




    dict_keys(['id', 'metadata', 'page_content', 'type'])



The Document object is a [pydantic](https://docs.pydantic.dev/latest/) model so we can take a look at the fields within:

- `id`: can be specified, and if not, one is generated
- `metadata`: metadata that accompanies the database entry and can be used for things like filtering
- `page_content`: the data that was encoded to create the embedding vector for the database entry
- `type`: not sure of it's use, but specifies the Document type



```python
vec_db = QdrantVectorStore.from_documents(
    creature_docs.load(),  # documents from the Loader
    embedding_model,  # the embedding model to use for encoding
    path="db-dir",  # the director to store the database
    collection_name="creatures",  # name of the collection in the database to use
)

```

Now that the database has been created and populated with the creature data, we can query the database to find entries through semantic similarity.  We can provide a search query along with a `k` value to specify how many of the top results to return based on similarity score.



```python
[
    (i[-1], i[0].metadata['name'], i[0].page_content) for i in vec_db.similarity_search_with_score(
        query='A creature found in a swamp',
        k=2
    )
]

```




    [(0.49281070085688317,
      'Froghemoth',
      "the froghemonth is a truly unsettling creature a monstrous, bloated frog animated by a dark, necromantic energy. imagine a frog, but far too large, covered in decaying vegetation and sporting disturbingly human like hands and feet. patches of slick, greenish skin are exposed amongst the rot, and its eyes glow with an unnatural, cold light. it doesn’t simply *hop*; it lurches and drags itself forward, leaving a trail of swamp muck. more disturbing than its appearance is what *makes* it a froghemonth. it’s created when a humanoid is transformed and horribly merged with a giant frog, retaining fragmented memories and a mournful, echoing croak that sounds eerily like broken speech. a froghemonth is best used as a tragic encounter. perhaps the players stumble upon one in a ruined temple or forgotten swamp, the creature a lingering consequence of a long ago ritual. it's a monster that evokes pity as much as fear. it’s not a straightforward combat encounter; consider allowing for a non violent resolution, or presenting clues to *why* it exists, potentially leading to a quest to undo the transformation. it’s strong enough to be a challenge, but the emotional weight of its existence is what makes it truly memorable."),
     (0.4218312216543241,
      'Ancient Green Dragon',
      "the ancient green dragon is a truly terrifying apex predator, embodying the decay and secrets of the swamp. these dragons are massive, covered in moss and algae, blending seamlessly with their murky habitat. unlike their more overtly fiery cousins, green dragons favor poison and illusion. they’re cunning manipulators, preferring to corrupt and control rather than simply destroy. they revel in psychological warfare, using subtle whispers and false promises to lure victims into their lairs, or twisting good intentions into ruin. an ancient green dragon doesn't just *live* in a swamp; it *is* the swamp. its lair is a twisted network of flooded caverns, overgrown ruins, and suffocating vegetation, all permeated by a cloying, poisonous mist. they collect treasure not for its value, but for what it represents power over others, or the downfall of civilizations. this dragon is best used as a campaign level threat, not a random encounter. introduce it gradually, hinting at a growing corruption within a region. perhaps the party investigates missing persons, blighted crops, or a rising tide of paranoia. the ancient green dragon serves as a perfect villain for a campaign focused on investigation, intrigue, and confronting a subtle, insidious evil, rather than a straightforward battle. it’s a creature that will challenge players to think beyond combat and confront difficult moral choices.")]



We can see that the top two creatures are a frog and a dragon that resides in a swamp!

You might notice that the scores are seemingly quite low. This is because the query in it's entirety is being compared to the the entire `page content` for each creature.  This highlights that consideration regarding what is being encoded is very important as there can be a trade off between breadth of context and appropriate data retreval.


## Creature RAG Chain

Now that all the foundation pieces are in place, we can turn to making a RAG chain.

The idea here is that we want an interface were context about the scernario and a request can be provided to the model so that it will return a recommendation of a creature, or set of creatures, to use for the encounter requested.

Like just about everything in working with LLMs, it all starts with a prompt.  The prompt here is attempting to do a few things, much like the creature description one above:

- States system level expectations about how the model is to respond and what kind of role it's meant to take when processing the request
- Describes how the model is meant to contextualize the input and what it's meant to provide as output, even with an example

We're asking that the model take the request, retrieve creature data from the vector database and provide a list of suggestions along with some reasoning behind them and a note to the game master on how they should go about using the creature within the scenario.



```python
from langchain.chains import create_retrieval_chain 
from langchain.chains.combine_documents import create_stuff_documents_chain

creature_rag_prompt_template = """Using the provided encounter scenario or requirements,
find a list of creatures that would best fit the encounter.
Provide a list of the creature names and a brief reasoning on why the might make
for a good fit. Provide a small note about how the game master should play these creatures to help
enhance the encounter experience. It's okay to suggest that more than one of a single creature be used.
The reasoning for the selection should be a very short and brief, no more than a couple of
sentences. Respond in the a structured markdown format that include the name of the creature, the number of them,
the reason for using them, and the game master note. for example:

1. creature name (number of creatures)
- **Reason:** The reason for the creature
- **GM Note:** The note for how to play the creature(s) to enhance the experience


Creature Context:
{context}

Scenario Description or Requirements:
{input}

"""

creature_rag_prompt = PromptTemplate(
    input_variables=["context", "input"],
    template=creature_rag_prompt_template
)

combine_docs_chain = create_stuff_documents_chain(
    llm=get_llm('gemma3:27b'),
    prompt=creature_rag_prompt,
    document_variable_name="context"  # important to match your prompt
)

# create the retrieval chain
creature_rag_chain = create_retrieval_chain(
    retriever=vec_db.as_retriever(),
    combine_docs_chain=combine_docs_chain
)

```

With the prompt ready, we can create a retrieval chain that will use the [create_stuff_documents_chain](https://python.langchain.com/api_reference/langchain/chains/langchain.chains.combine_documents.stuff.create_stuff_documents_chain.html) method to take advantage of the list of documents retrieved from the vector database search by stuffing them into the `{context}` portion of the prompt template.  The `{input}` portion is where the input to the chain (the encounter scenario description) will be injected.

The vector database is a langchain [vectorstore](https://python.langchain.com/docs/concepts/vectorstores/) object and gets called as a [retriever](https://python.langchain.com/docs/concepts/retrievers/) to conform to the langchain retriever interface and work in the pipeline.



## Step 5: Generate Generate!

Now that we've got our RAG chain setup, it's time to generate some encounters!

It's easy to get carried away experimenting so I'll just show a few encounter scenarios to demonstrate the surprising range this relatively simple implementation has:

- An combat enecounter with a descriptive setting and a focus on new players
- A benign encounter to enrich a scene for the players
- An aggressive encounter described by what the game master might want them to feel



```python
beginner_combat_encounter = creature_rag_chain.invoke(
    {
        'input': '''The party is deep into a dense eerie forest, they are lower level, and the party
        is comprised of a cleric, a bard, and a fighter. I want the encounter to be easy since they
        are new to the game and I want them to just learn the basics of combat.'''
    }
)

benign_encounter = creature_rag_chain.invoke(
    {
        'input': '''A party consisting of a monk, a bard, and a ranger find themselves on the bank of a
        river on the edge of a forrest. I want a beign encounter with a creature that will amaze them and 
        they can interact with but poses no threat to the party'''
    }
)

fear_encounter = creature_rag_chain.invoke(
    {
        'input': '''A party consisting of a paladin (lvl 13), a ranger (lvl 15), and a fighter (lvl 14)
        are deep in a massive, dark cave. I want to give them an encounter that strikes fear into
        their hearts makes them regret their life choices that led them to this moment'''
    }
)


```

Let's finally take a look at the results! I think they're pretty incredible.

---
**The Beginner Encounter**


```python
display(Markdown(beginner_combat_encounter['answer']))

```


Here's a breakdown of creatures suitable for a low-level party (Cleric, Bard, Fighter) in a dense, eerie forest, focused on being an *easy* introductory combat encounter:

1. **Korreds (2-3)**
   - **Reason:** Korreds aren't inherently aggressive and can be played as mischievous rather than outright hostile. This allows the party to potentially talk their way out of the encounter, or resolve it with cleverness instead of pure combat. Their low CR makes them manageable for new players.
   - **GM Note:** Play them as annoyed guardians of the forest, more inclined to trick and misdirect than instantly attack. Describe their illusions and cryptic warnings. If combat *does* happen, have them prioritize illusions and minor hindering spells over direct, damaging attacks. Give the players opportunities to understand *why* the Korreds are upset (perhaps they trampled a sacred patch of mushrooms!) and offer a solution.

2. **Hadrosaurus (1 - Young/Injured)**
   - **Reason:** A single, panicked Hadrosaurus provides a challenging *obstacle* rather than a direct fight. The party can attempt to avoid it using stealth or distract it. If combat *happens* due to panic, it’s about avoiding being trampled, not necessarily ‘defeating’ the creature.
   - **GM Note:** Focus on the creature’s size and chaotic movements. Describe the ground shaking as it crashes through the undergrowth. Make it clear that attacking the Hadrosaurus might be more trouble than it's worth – it’s scared and disoriented, not malicious. The objective is to survive the encounter, not necessarily ‘win’.

3. **Minotaur (1 - Very Young/Calf)**
   - **Reason:** A young minotaur calf is small and will not be an overwhelming force. This allows the party to learn combat without being overwhelmed, and sets the stage for a possible encounter with a larger minotaur down the road.
   - **GM Note:** This calf should be more curious than aggressive, however, it will still defend itself if attacked. Perhaps the party can soothe it with a calming voice or offer it food? The minotaur should act like a scared animal, not a bloodthirsty brute.



**Important Considerations for an Easy Encounter:**

*   **Low Initiative Counts:** Don’t roll high for the creatures’ initiative. Let the party go first to give them a chance to set the pace.
*   **Missed Attacks:** Have the creatures miss a significant number of attacks, especially early in the encounter.
*   **Limited Special Abilities:** Don't use the creatures' more complex abilities right away. Start with basic attacks and gradually introduce complexity as the players become more comfortable.
*   **Focus on Roleplaying:** Encourage the players to describe their actions and engage with the environment. This will help them feel more immersed in the game and make the encounter more enjoyable.
*   **Reward Effort:** Even if the players make mistakes, reward their creativity and effort. This will encourage them to keep playing and learning.






**The Benign Encounter**



```python
display(Markdown(benign_encounter['answer']))

```


Here’s a breakdown of creatures suited to your scenario – an amazing, non-threatening encounter on a riverbank – with GM notes to enhance the experience. Given the requirements, I’m prioritizing creatures that lean towards wonder and interaction rather than combat.

1. **Giant Elk** (1)
   - **Reason:** A majestic creature that naturally fits a forest/riverbank setting. Its generally peaceful demeanor allows for a non-hostile interaction, and its size will be impressive.
   - **GM Note:** Don't focus on stats. Present the elk as simply *being* – grazing, drinking from the river.  The encounter should be about observation and perhaps a subtle test of the Ranger's skills (tracking, understanding animal behavior). Perhaps it's shedding velvet from its antlers, creating a beautiful, magical scene.  The Monk might be fascinated by its grace, the Bard inspired to compose a song.  If the party offers a suitable offering (berries, a song, a display of respect), the elk might allow a brief, peaceful interaction or even lead them to a hidden clearing.

2. **Water Weird** (1 - *modified*)
   - **Reason:** While normally predatory, a Water Weird *can* be presented as a guardian spirit of the river, rather than a monster.  Its fluid form lends itself to awe and wonder.
   - **GM Note:**  Completely remove the aggressive programming. Instead, present the Water Weird as a swirling column of water that *observes* the party. It might mimic their forms playfully, or create beautiful patterns in the water. It isn’t speaking, but communicates through imagery and emotion. The Monk might perceive a sense of ancient wisdom, the Bard feel a creative surge, the Ranger notice the river's health is tied to the Weird's well-being. Perhaps the Weird is distressed about pollution or a blockage upstream, presenting a low-stakes quest for the party to resolve.

3. **Black Bear** (1 - *young cub, mother nearby but hidden*)
   - **Reason:** A young bear cub is naturally cute and intriguing.  It provides a moment of wonder and possibly a small interaction (observing it, leaving it a treat) without being inherently threatening.
   - **GM Note:** Emphasize the *cub's* innocence and playfulness. The mother bear should *not* be directly seen, but the Ranger should pick up signs of her presence (tracks, scent). The cub might be clumsily attempting to fish, or playing with pebbles. Focus on the cuteness and vulnerability. If the party approaches cautiously, the cub might simply observe them with curiosity. The Ranger should be able to tell the mother is nearby and protective, reinforcing the need for caution.  Avoid any aggressive behavior.



I would recommend the **Giant Elk** as the strongest fit for your scenario. It perfectly embodies the "amazing" and "non-threatening" criteria, and allows for a beautiful, atmospheric encounter. The Water Weird and Bear options are good if you want to add a touch of mystery or a slightly more active encounter, but require more careful GMing to avoid any sense of danger.


**The Fear Encounter**


```python
display(Markdown(fear_encounter['answer']))

```


Here’s a breakdown of creatures that would fit a terrifying encounter for a level 13-15 party in a massive, dark cave, focusing on fear and regret, along with GM notes:

1. **Grick Alpha (1)**
   - **Reason:** The Grick Alpha is the core of this encounter, representing a primal, terrifying predator perfectly suited for a dark cave. Its ambush tactics and cunning will keep the party on edge.
   - **GM Note:** Emphasize the *feeling* of being hunted. Describe the cave seeming to *shift* as the Grick Alpha blends into the stone. Have it target the most isolated party member first. Play up the psychological horror – sounds of scraping stone *just* out of sight, the smell of something ancient and predatory.

2. **Darkmantle (3)**
   - **Reason:** Darkmantles amplify the darkness and create chaos. They’ll harass the party, extinguishing light sources and isolating members, increasing the Grick Alpha's effectiveness.
   - **GM Note:** Don’t just have them attack; have them *swarm*. Focus on the claustrophobic feeling of being enveloped in darkness. Describe the draining cold as they grapple, and the disorientation of losing sight of allies. Have one target the Paladin to hinder their Divine Smite.

3. **Svirfneblin (5 - Illusionists/Tricksters)**
   - **Reason:** The Svirfneblin aren’t the primary threat, but they *create* the environment of fear and regret. They’ve used illusions to show the party visions of their failures, loved ones lost, or terrible futures.
   - **GM Note:** These Svirfneblin aren’t fighting; they’re *tormenting*. Describe realistic, personalized illusions that play on each character's backstory and regrets. Have them appear and disappear, whispering taunts or lamentations. They shouldn't attack, but flee deeper into the cave, leading the party further into the Alpha's hunting ground.  Focus on descriptions that trigger emotional responses.

4. **Wolves (4 - Dire Wolves preferred)**
   - **Reason:** While not the primary threat, dire wolves will serve to enhance the feeling of being hunted and vulnerable, filling the cavern with unsettling howls and creating a sense of impending doom.
   - **GM Note:** Have the wolves positioned around the perimeter, adding to the feeling of being surrounded. They shouldn't engage directly, but rather act as a distraction or attempt to isolate weaker party members. Use their howls to signal the Grick Alpha's movements and intensify the psychological pressure.



**Encounter Flow Suggestion:**

1.  **Initial Haunting:** The party enters a large cavern. They immediately experience unsettling illusions created by the Svirfneblin – flashes of regret, loss, or fear.
2.  **Wolves & Darkness:** The dire wolves begin circling, and the Darkmantles descend, extinguishing light sources and plunging sections of the cavern into darkness.
3.  **The Alpha's Reveal:** As the party struggles with the darkness and illusions, the Grick Alpha ambushes them, taking advantage of the chaos. It should target the most vulnerable or isolated character first.
4.  **Escalation:** The Darkmantles continue to harass, and the Svirfneblin’s illusions become more intense, creating a truly harrowing experience. The wolves continue to attempt to isolate and harass.



This combination of creatures and the suggested encounter flow should create a terrifying and memorable experience for your party, playing on their fears and regrets. Remember to emphasize the *atmosphere* and *psychological* impact of the encounter, rather than just focusing on combat.


---

The response contains the `input`, the `context` and the `answer`.  The `input` and `answer` we've already seen, but let's take a quick look at the context.  It contains each of the documents retrieved from the vector database.



```python
[doc.metadata['name'] for doc in benign_encounter['context']]

```




    ['Minotaur', 'Black Bear', 'Water Weird', 'Giant Elk']



## Conclusion
This was a long one, so I'll leave it here. I appreciate you for getting through it and I grant you Inspiration.  This is just a beginning and there are a lot of paths to go from here, so maybe I'll do a follow up at some point.

I hope this was helpful, insightful, and/or encouraging and please feel free to reach out if you have any questions or suggestions.

This was but one way to go about accomplishing the goal. There are other tools and methods that might be more appropriate for different use cases. Things like using [langgraph](https://www.langchain.com/langgraph) or building [AI Tools](https://python.langchain.com/docs/integrations/tools/) either in langchain or one of the many other offerings out there like [CrewAI](https://www.crewai.com) or [PydanticAI](https://ai.pydantic.dev). There are also a number of other vector database offerings as well. There's a plethera of AI related tools and techniques, and even the established ones are constantly changing. I'm hoping this was as much a view into approaching an idea as much as a means to accomplish it.


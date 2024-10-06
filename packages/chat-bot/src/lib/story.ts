const APP_ASSETS_DISTRIBUTION_URL = `https://${process.env['ASSETS_DISTRIBUTION_DOMAIN_NAME']}/chatbot`;

export const STORIES = {
    story1: [
        {
            content:
                'Did I tell you about the time I was blown away by the wind, and ended up in the trash can? 🗑😔',
            options: ['😱', 'Oh no!'],
        },
        {
            content:
                "It was the worst! I thought I'd never get out, and might even end up getting burnt with the rest of the trash",
            options: ['Poor eddii', 'End story'],
        },
        {
            content:
                "I cried and cried, but then I heard a voice.  It was cockroach from Central Park! 🐛.  I couldn't believe my eyes! We were never really good friends, but at that moment seeing a familiar face was magical!",
            options: ['I can imagine!', 'End story'],
        },
        {
            content:
                'He knew a way out so I climbed on his back and we got out of there! Got home, showered and everything felt normal again.',
            options: ['☕️', 'End story'],
        },
        {
            content:
                'Cockroach visits every week now.  We are sort of good friends',
            options: ['☺️', 'End story'],
        },
        {
            content:
                'My point is, always stay hopeful, regardless of your situation.  Something good will come out of it!',
            options: ['👍'],
        },
    ],
    story2: [
        {
            content:
                'My great grandfather flew here from Canada on the back of a crow in 1967',
            options: ['Next'],
        },
        {
            content:
                'He chose Central Park as our home because of tourists who visit the park every day.  He wanted us to learn about different cultures.',
            options: ['Interesting!', 'OK, go on', 'End story'],
        },
        {
            content: 'Oh and he loved people watching!',
            options: ['Interesting!', 'End story'],
        },
        {
            content:
                'The world is a big place.  Some leaves are green, others are orange, or have spots on them 🍃',
            options: ['Interesting!', 'End story'],
        },
        {
            content:
                'Always remember that you are unique, just like everyone else is.',
            options: ['☺️', 'Do tell eddii'],
        },
    ],
    story3: [
        {
            content:
                'Did I tell about the time I left my heart in Paris? It was the summer of 2011. I was backpacking through Europe with a young leaf. Despite the fact that I was on budget, I decided to treat myself to a nice restaurant in front of the Eiffel tower.',
            options: ['Tell me more!'],
        },
        {
            content:
                'This place was so beautiful! You could see the Eiffel tower in all its glory. All the staff were wearing tuxedos so I decided to wear my fancy bowtie too.',
            options: ['Fancy eddii!'],
        },
        {
            content:
                'And that was when I saw her. The most beautiful tulip that has ever been made. Delicate purple skin, long green neck with the grace of an angel.',
            options: ['Describe her more!'],
        },
        {
            content:
                'I could not help myself. Before I knew it I was walking towards her and shakily introduced myself. Her name was Alizze. Sweet beautiful Alizee.',
            options: ['Do tell eddii'],
        },
        {
            content:
                'We ended up spending the whole evening together. We laughed, we drank, we danced. By the end of the night, I knew she was the flower I was meant to spend the rest of my life with.',
            options: ['Next', 'End story'],
        },
        {
            content:
                'I proposed to her that same night. She said that things were moving too fast. That she needed time to think about it. I said I understood and that I will be back the next day to see if she had changed her mind.',
            options: ['Next', 'End story'],
        },
        {
            content:
                'I went back the next night, but she was gone. I asked one of the native leaves if he knew where Alizee was.',
            options: ['What did the leaf say?'],
        },
        {
            content:
                'He told me that they changed the flowers every week and that the old flowers were donated to the funeral home. Until this day, I think of my sweet Alizee and where she might be.',
            options: ["I'm sorry", 'Oh no!', '😞'],
        },
        {
            content:
                "Life is full of opportunities, but make sure you don't let the opportunities slip through your fingers.",
            options: ['Next', 'End story'],
        },
    ],
    story4: [
        {
            content:
                'I tried stand-up comedy for the first time in NYC last month. A couple of friends of mine have been telling me how funny I am  and that I should try stand-up.',
            options: ['Tell me more!'],
        },
        {
            content:
                'I was super nervous. I mean, can you imagine standing in front of a group of strangers and trying to make them laugh?',
            options: ['I can imagine!', 'Not really'],
        },
        {
            content:
                'One of my wiser friends, Peter the duck, told me that if something scares you, then you should do it because it will make you stronger. So I decided to go for it!',
            options: ['Go eddii!'],
        },
        {
            content:
                'I have to be honest it was terrifying going on stage, my hands were sweaty and I wanted to run through the back door',
            options: ['Oh no!', 'I hear you eddii'],
        },
        {
            content:
                'But once I grabbed that mic and made my first joke, I forgot about it all.  People started clapping and laughing. It all felt so surreal.',
            options: ['Next', 'End story'],
        },
        {
            content:
                'That night I did the one thing that scared me the most, and I survived. There is nothing that can hold you back from your dreams.',
            options: ['Next', 'End story'],
        },
    ],
    story5: [
        {
            content:
                'Last week I went to my first Broadway Show on Times Square, New York. A friend of mine got me a ticket. I have to say the people that work on these shows are amazing artist.',
            options: ['Do tell eddii', 'Tell me more'],
        },
        {
            content:
                'The acting and dancing too. The show was great! Visually stunning. But the best part was the soundtrack!',
            options: ['Next', 'End story'],
        },
        {
            content:
                "I've been listening to the music on loop ever since. I left the show feeling inspired.",
            options: ['Rocking it eddii'],
        },
        {
            content:
                'It is important to make time in your daily life to be entertained. It could be as simple as going to the movies or just taking a nice walk in a park.',
            options: ['☺️'],
        },
    ],
    story6: [
        {
            content:
                "You won't believe what a psychic told me the other day. I used to not believe in astrology until I met her.",
            options: ['Next'],
        },
        {
            content:
                'She knew so many things about me. Stuff like: the fact that I live in a tree, that my favorite color is green, that I love to sunbathe!',
            options: ['Do tell eddii'],
        },
        {
            content:
                'I was really impressed with her powers. She even told me I will be traveling soon to a very remote location. And that I will be running into an old friend.',
            options: ['Next', 'End story'],
        },
        {
            content:
                "I'm not sure if this will come true or not. But all I know is that her stories have given me permission to dream again.",
            options: ['☺️'],
        },
    ],
    story7: [
        {
            content:
                "The new smartphones are out! I'm so excited! You know I'm obsessed with technology.  I mean, good technology, not all that crappy old flip phones. But the real deal.",
            options: ['ok...'],
        },
        {
            content:
                'So yesterday I went to see the new release and let me tell you… They were amazing!!!',
            options: ['Next', 'End story'],
        },
        {
            content:
                'Not only was I able to stream all my favorite TV shows like: “House of Leafs” or “A leaf to Remember”. But I was also able to play my favorite music “Just Be-Leaf”.',
            options: ['Next', 'End story'],
        },
        {
            content:
                'I could not help myself but to start to dance in front of everybody. Everybody was staring!',
            options: ['Go eddii'],
        },
        {
            content:
                "Oh well. Sometimes you can't help but dance like nobody's watching",
            options: ['🍃'],
        },
    ],
    story8: [
        {
            content:
                'Couple of days ago I felt my back was so stiff. Did not know what to do. I tried many things; I hung myself up side down, I rolled on the floor, I even tried hot yoga. But nothing seemed to make by back feel better.',
            options: ["I'm sorry eddii", 'Feel better'],
        },
        {
            content:
                'And that is when I ran into them. A group of very healthy-looking tulips exercising right here in Central Park.',
            options: ['Next', 'End story'],
        },
        {
            content:
                'I went over and asked them, what are you doing? They said they were doing pilates. And that pilates is good for aligning of the spine.',
            options: ['Next', 'End story'],
        },
        {
            content:
                'Well I was sold in the whole pilates concept. And before I knew it I was exercising with them.',
            options: ['Next', 'End story'],
        },
        {
            content: 'Mind and body require proper care to function correctly.',
            options: ['Next', 'End story'],
        },
    ],
    story9: [
        {
            content:
                'Today is the two year anniversary of the day that I lost one of my best friends, “Maple”.',
            options: ['Sorry to hear', '😞'],
        },
        {
            content:
                'We were camping near the Niagara falls. He always talked about how much he liked waterfalls so my other friends and I planned this surprise trip for his birthday.',
            options: ['Next'],
        },
        {
            content:
                'We went to the border of the United States and Canada. I will never forget the look on his eyes! He was so thrilled that he would finally get to see the big waterfall.',
            options: ['Next'],
        },
        {
            content:
                'That night we decided to camp outside so we can see the stars and tell scary stories.',
            options: ['Next'],
        },
        {
            content: "And that's when it all happened",
            options: ['Next'],
        },
        {
            content:
                'It is always sad when you lose somebody you care so much about.  Even though they are not here today, they still live in our memories. And that is all that we can do, remember them.',
            options: ['Next', 'End story'],
        },
    ],
    story10: [
        {
            content: 'Guess what happened to me today?',
            options: ['cup of coffee', 'some unknown river', 'washer'],
        },
        {
            content:
                'The last thing I remember before falling asleep, I was lying on some soft clothes, dosing off',
            options: ['Next'],
        },
        {
            content:
                'The next thing I know, I am rolling deeply in the laundry machine with a pile of clothes',
            options: ['poor eddii', '😱', 'LOL'],
        },
        {
            content: 'SOS! Nobody heard me, the washer is just so loud.',
            options: ['Next'],
        },
        {
            content:
                "And then I give up. I mean, if I cannot change the situation, why not just make the best out of it. It's great to have a deep cleaning shower, from inside out. Welcome to a totally fresh me!",
            options: ['Cool', '🤟🏼'],
        },
    ],
    story11: [
        {
            content:
                "Summer time is always a hard time for me. I become lazy when it's super hot. How do you feel about the high temperatures?",
            options: ['Same', 'I like summer', 'With AC now'],
        },
        {
            content:
                'Back in 2009, my spiritual retreat trip to New Mexico almost ended with no return',
            options: ['What happened?'],
        },
        {
            content: 'It was 110 F (43 C)',
            options: ['OMG 😱', 'cannot believe it', 'You are lucky'],
        },
        {
            content:
                'Thank god I met a kind lady who shared some water and a shade to rest. Sweet sweet lady!',
            options: ['Next', 'End story'],
        },
        {
            content:
                'I feel so grateful. I realized that we are all here on earth to help each others; So after I came back, I always help others as much as I can.',
            options: ['Me too', 'Nice!'],
        },
        {
            content:
                "It's truly a spiritual retreat. Helping others is helping yourself.",
            options: ['Next', 'End story'],
        },
    ],
    story12: [
        {
            content:
                'My friend Mr. Squirrel is late. So I am waiting for him alone on a branch.',
            options: ['New York traffic!', 'Tardy squirrel'],
        },
        {
            content:
                "I've started to count down, hoping that he will show up soon.",
            options: ['Next'],
        },
        {
            content:
                'And then the stunning view of NYC skyline caught my eyes.',
            options: ['Next'],
        },
        {
            content:
                'When was the last time you sat by yourself and stared into distance, enjoying that inner peace?',
            options: ['Long time ago', 'Always'],
        },
        {
            content:
                'Nowadays, people moves so fast. We keep walking, keep working, seldom do we have time for ourselves. I treasure these moments very much.',
            options: ['TRUE', 'Me too!'],
        },
        {
            content:
                "If Squirrel showed up, I'm gonna thank him for being late",
            options: ['Thank you eddii', 'Next'],
        },
    ],
    story13: [
        {
            content:
                'I went surfing last summer at the golden beach in Sydney. Sunshine gives me a tan. Like other coastlines, there are lots of people lying down on the beach, playing baseball, and of course, surfing!',
            options: ['😎', 'I love surfing!'],
        },
        {
            content:
                "My friend and I decided to give it a try. I saw babies standing on the surfing board, safe and sound. Why couldn't I!",
            options: ['Next', 'End story'],
        },
        {
            content:
                'So I got into the water. I can do this! After thousands of times trying and trying, I made it!!!',
            options: ['👏🏼', 'Good job! 💪'],
        },
        {
            content:
                'You never know what you can do before you actually try it! The wave gives me fearless courage',
            options: ['Next', 'End story'],
        },
        {
            content: 'Confidence comes with time and practice',
            options: ['Do tell eddii'],
        },
    ],
    story14: [
        {
            content:
                'Hey! Have I ever told you about the time I ended up in a trash can?',
            options: ['😱', 'Oh no!'],
        },
        {
            content:
                'So there I was, just minding my own business when WHOOSH! A wind gust blew me right out of my boots!',
            options: ['Continue'],
        },
        {
            content:
                'I was tossed up in the air like a little … um, well … leaf … and landed right in a trash can. It was gross!',
            options: ['Poor eddii'],
        },
        {
            content:
                'I was stuck deep in the garbage; just sitting there on top of a half-eaten donut and my foot covered in honey. At least I hoped it was honey…',
            options: ['Continue'],
        },
        {
            content:
                "I felt like I would never make it out! Was I going to have to start eating the donut soon just so I wouldn't starve? I thought I was doomed!",
            options: ['I can imagine!'],
        },
        {
            content:
                "Just before I had a full meltdown I heard a sound. It was coming from just behind an empty soda can. I looked over and it was my old pal Cockroach from Central Park! We haven't seen each other in forever, but boy was I glad to see a familiar face!",
            options: ['☕️'],
        },
        {
            content:
                'He told me he knew this trash can like the back of his antenna and helped me get out! I was back home in no time, fully showered and freshened up. I felt so relieved … and clean!',
            options: ['Continue'],
        },
        {
            content:
                "Which reminds me — being in that trash can sure wasn't ideal, but it did bring me back to an old friend and reminded us of the good times we used to have. Cockroach visits me every week now!",
            options: ['☺️'],
        },
        {
            content:
                'I guess my point is — no matter what tricky setting you find yourself in, always stay hopeful. You never know what — or who — is just around the corner to help ease the situation. Something good just may come out of it!',
            options: ['👍'],
        },
        {
            content: '…I never did find those boots though. =/',
            options: ['End story'],
        },
    ],
    story15: [
        {
            content: "Hey, here's an interesting little tidbit for you!",
            options: ['Continue'],
        },
        {
            content:
                'Way back in 1967 my great grandfather flew here from Canada — he hitched a ride on the back of a crow, of course.',
            options: ['Interesting!', 'OK, go on'],
        },
        {
            content:
                "Central Park was the chosen destination because that's where he wanted to reside. He thought the residents and tourists in the area offered a perfect opportunity for his family to learn about different cultures.",
            options: ['Continue'],
        },
        {
            content:
                "Oh, and the people-watching provided plenty of entertainment! Let's just say there is no shortage of characters in good ol' NYC.",
            options: ['Continue'],
        },
        {
            content:
                'But it has definitely taught me that the world is a great big place filled with so many diverse individuals!',
            options: ['Continue'],
        },
        {
            content:
                'So while some leaves are green and some are orange, some people are tall and some are short…',
            options: ['☺️', 'Do tell eddii'],
        },
        {
            content:
                "No matter what size, shape, or color you are — or even where you were born —it's important to remember that you are unique. No one can be exactly like you with your same exact experiences. And that's pretty cool!",
            options: ['End story'],
        },
    ],
    story16: [
        {
            content:
                'Did I tell you about the time I left my heart in Paris? ❤️',
            options: ['Nope', 'Tell me about it'],
        },
        {
            content:
                'Back in the summer of 2011 I was backpacking through Europe 🍃. Although I was on a tight budget I decided to treat myself to a nice dinner in front of the Eiffel Tower.',
            options: ['Continue'],
        },
        {
            content:
                "It was an amazing scene! You can see the Eiffel Tower in all its glory! The waitstaff dressed in fancy tuxedoes, so I of course had to wear my special bowtie that night. (Yes, I do pack a bowtie to go backpacking! Doesn't everyone?) 🍽️ ☺️ 🤵",
            options: ['Fancy eddii!'],
        },
        {
            content:
                "Just as I was about to glance at the menu that's when I saw her — the most beautiful tulip I ever laid eyes on 🌷",
            options: ['Continue'],
        },
        {
            content:
                "And that's when I saw her.  The most beautiful tulip ever made.  Pink skin with a long green neck",
            options: ['Continue'],
        },
        {
            content:
                'Delicate purple petals, a mesmerizing stem, and the grace of an angel. I just had to muster up the confidence to introduce myself! Her name was Alizze. Sweet, beautiful Alizze.',
            options: ['Continue'],
        },
        {
            content:
                "We laughed, we drank, we spent the whole night together. Turns out this was her favorite place and she was there every day. She was perfect and I didn't even scare her away with my dance moves!",
            options: ['Lucky eddii'],
        },
        {
            content:
                'When the night finally ended I already wanted to make plans to see her again. I knew she was the flower I was meant to be with!',
            imageUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii_with_alizee.png`,
            options: ['❤️'],
        },
        {
            content:
                'I proposed to her that same night.  But she said things were moving so fast and that she needed time to think about it',
            options: ['Continue'],
        },
        {
            content:
                'So with my heart pounding in excitement, I came back the following night to find my sweet Alizze. ',
            options: ['Continue'],
        },
        {
            content:
                'To my dismay, despite her being there every day, she was no where to be found. I asked one of the waiters if she had been around yet.',
            options: ['What did the waiter say?'],
        },
        {
            content:
                'He told me that the flowers get changed every week and the old ones get donated to funeral homes. My little leaf heart was crushed 😞. To this day I still think of my dear Alizze and where she might be.',
            options: ["I'm sorry", 'Oh no!', '😞'],
        },
        {
            content:
                "It remains one of the biggest regrets of my life but is a reminder that life is full of opportunities; we need to make sure we don't let them slip through our fingers!",
            options: ['End story'],
        },
    ],
    story17: [
        {
            content:
                'Hey, guess what? I actually tried stand-up comedy for the first time last month!',
            options: ['Getting famous eddii!'],
        },
        {
            content:
                "A few of my friends have been telling me how funny I am (well, don't look so shocked!) and that I should give stand-up a try.",
            options: ['I can imagine!', 'Not really'],
        },
        {
            content:
                'But one of my wiser friends, Peter the Duck, told me that if something scares you then it should make you want to do it. Facing your fear head on will make you stronger. So even though I was terrified … I decided to go for it!',
            options: ['GO EDDII!'],
        },
        {
            content:
                'Honestly, I was shaking like a leaf (get it!?) when I got up on that stage. I felt like I just wanted to run the other way and get out of there ASAP.',
            options: ['Oh no!', 'I hear you eddii'],
        },
        {
            content:
                "But once I grabbed the mic and made my first joke, all the worry disappeared. It was awesome! It was like I was so locked in on performing my act that I didn't even have time to be worried. People started clapping and laughing — it felt surreal!",
            imageUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii_with_mic.png`,
            options: ['Continue'],
        },
        {
            content:
                "So that was a night I happened to do something that scared me. I didn't let it hold me back, and I survived! I truly understand now that there is nothing that can hold you back from your dreams.",
            options: ['Inspiring!', 'Tell me more'],
        },
        {
            content:
                'So I hope you think of me next time you get worried about trying something! The only person stopping you is you.',
            options: ['Fantastic!', 'Well done eddii'],
        },
    ],
    story18: [
        {
            content: 'Have you ever been to a play or musical before?',
            options: ['Yup', 'No, never'],
        },
        {
            content:
                'Last week a friend got me a ticket to my first Broadway show in Times Square, New York. I must say, the people who work to put these shows together deserve a TON of credit!',
            options: ['Do tell eddii', 'Tell me more'],
        },
        {
            content:
                'The acting, the dancing, the lights, the production — it was all so amazing. Everything about the show was so well done, but the best part for me was the soundtrack!',
            imageUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii_at_opera.png`,
            options: ['Continue'],
        },
        {
            content:
                "I've been rocking out to the music on loop ever since I walked out of that theater. It left me with such a feeling of inspiration.",
            options: ['Rocking it eddii', '☺️'],
        },
        {
            content:
                "Sometimes I like to be a homebody, but I'm glad I went out to see that show with my friend that night. It's important to treat yourself to a good time once in a while and not get caught up in the daily routine every day.",
            options: ['Continue'],
        },
        {
            content:
                "It could be as simple as going to a movie or just taking a nice stroll through a park. The park is actually where a lot of us leaves tend to hang out. Maybe I'll see you there some time!",
            options: ['End story'],
        },
    ],
    story19: [
        {
            content:
                "You won't believe what a psychic told me the other day! I never believed in astrology or anything like that before, but I think that has now changed…",
            options: ['Continue'],
        },
        {
            content:
                'She knew so many things about me. Things like: I live in a tree, my favorite color is green, and that I love to sunbathe! I mean, how is that possible!?',
            options: ['Do tell eddii'],
        },
        {
            content:
                "She said she's not even on LeafBook to be able to see that exact info on my social media profile! Crazy!",
            options: ['Do tell eddii'],
        },
        {
            content:
                "I was really impressed with her special powers. She even predicted that I'll be traveling soon to a very remote location. Not only that, but she added that once there, I'll run into an old friend! I wonder what beautiful remote location it will be?",
            options: ['Continue'],
        },
        {
            content:
                "I'm not sure if it will come true or not, but all I know is that her stories have at least awoken my imagination again.",
            imageUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii_with_psychic.png`,
            options: ['👍'],
        },
        {
            content: 'Never lose your sense of wonder! 😉',
            options: ['End story'],
        },
    ],
    story20: [
        {
            content:
                "I'm so excited that the new smartphones are out! I'm obsessed with technology. Well … the good technology … not the crappy old flip phone stuff from back in the day. Just the real deal mega cool stuff today! 📱",
            options: ['Continue'],
        },
        {
            content:
                'So I went to go see the new release, and let me tell you … they were NEAT-O!',
            options: ['Continue'],
        },
        {
            content:
                'Not only does it allow me to stream my favorite shows like “House of Leaves” or “A Leaf to Remember”, but it also has music loaded so I can play my favorite song “Just Be-Leaf.”',
            options: ['Go eddii'],
        },
        {
            content:
                "That song rules. Once I hear it I can't help but shake it. Hopefully the other customers in the store didn't mind 🕺",
            imageUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii_dance.png`,
            options: ['Nice!', 'Not my thing'],
        },
        {
            content:
                'Oh well, I guess sometimes you really do have to dance like no one is watching! Even if they really are watching … and staring …',
            options: ['Continue'],
        },
        {
            content:
                "and laughing while taking videos on their phones in the middle of a store. I'm pretty sure they were laughing with me though, right?",
            options: ['End story'],
        },
    ],
    story21: [
        {
            content:
                'A few days ago my back felt so stiff and was aching. I tried so many things to help relieve it — I rolled on the hard floor, I tried hot yoga, I even hung myself upside down! Nothing seemed to do the trick.',
            options: ["I'm sorry eddii", 'Feel better'],
        },
        {
            content:
                'Eventually I ran into a group of healthy-looking flowers exercising right here in Central Park.',
            options: ['Continue'],
        },
        {
            content:
                'I asked them what they were doing and they said it was something called “pilates.” They said pilates is a form of exercise that is good for the alignment of the spine.',
            options: ['Continue'],
        },
        {
            content:
                'Well that was all I needed to hear in order to be sold on this whole “pilates” concept. My back was literally aching for something like this!',
            options: ['Continue'],
        },
        {
            content:
                'Luckily the flowers were kind enough to let me join them and showed me how to do the exercises. Before I knew it I was following right along!',
            options: ['🌷'],
        },
        {
            content:
                "Not only has my back been feeling noticeably better, but I think I've become the most flexible leaf that ever lived. I felt great so I decided to keep going with the exercises.",
            options: ['Continue'],
        },
        {
            content:
                "After all, the mind and body require proper care to function properly. And I don't intend to let mine feel run-down again — it's the only one I have!",
            options: ['End story'],
        },
    ],
    story22: [
        {
            content:
                'Today is the two year anniversary of the day I lost one of my good friends, Maple. 🍃',
            options: ['Sorry to hear', '😞'],
        },
        {
            content:
                "I will never forget it. We were on a surprise camping trip near Niagra Falls for Maple's birthday. I can still see the look on his face when we told him. He was so thrilled that he was finally going to see the big waterfall!",
            options: ['Continue'],
        },
        {
            content:
                'That night we set up our camp under the stars and told ghost stories. It was chilly so we had a fire for some warmth.',
            options: ['Continue'],
        },
        {
            content:
                'Maple was always theatrical, so when it was his turn to tell a story he really got into it! He stood up during his story, acting like one of the monsters he was describing;',
            options: ['Continue'],
        },
        {
            content:
                "limping around and groaning like a grotesque creature. Unfortunately he was too concerned with his acting and wasn't paying attention to his surroundings…",
            options: ['Continue'],
        },
        {
            content:
                'All it took was one misguided step backward and that was it.',
            options: ['Continue'],
        },
        {
            content:
                "We all yelled to warn him, leaping out of our chairs to stop him, but it was too late. No sooner had he stepped into the flame than he turned to a pile of ash. Us leaves aren't exactly fire resistant.",
            imageUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii_at_funeral.png`,
            options: ['😞'],
        },
        {
            content:
                "It's always sad to lose someone you care about. Even though they're not around physically anymore, they still live on in our memories. It doesn't make it hurt any less that they're gone, but it's important to make sure they're never forgotten.",
            options: ['Continue'],
        },
        {
            content:
                'Sometimes the best thing to do is simply just remember the good times you had with them, and share the joyful stories of them with others.',
            options: ['End story'],
        },
    ],
    story23: [
        {
            content: 'Guess what happened to me today?',
            options: ['Cup of coffee', 'Fell in the river', 'Washer'],
        },
        {
            content:
                'I was up early this morning to go get my laundry done. As they say, the early bird gets the worm … and also the dryer that works the best!',
            options: ['Continue'],
        },
        {
            content:
                'However, I may have gotten up a little early. I leaned against a pile of clothes that were near me as I read the different options on the washer. My eyes were still a little heavy and before I knew it, I dosed off. Those clothes were quite comfy! 😴',
            options: ['Continue'],
        },
        {
            content:
                "All of a sudden I was abruptly awakened by the loud bang of a washer lid slamming shut. I couldn't believe my eyes — I was inside the washer!",
            options: ['OMG'],
        },
        {
            content:
                "Someone must've scooped me up with their clothes on accident while I was sleeping. Before I could get their attention the washer was on and spinning me around like a horrific carnival ride!",
            imageUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii_laundry.png`,
            options: ['😂', '🥺'],
        },
        {
            content:
                "I tried yelling and waving my arms to grab anyone's attention, but it was no use. The washer was just too loud.",
            options: ['Continue'],
        },
        {
            content:
                "Eventually I surrendered and just let the washer take me for a ride. I figured if I cannot change the situation then I might as well make the best of it. If I'm being honest, I was probably a little overdue for a washing anyway…",
            options: ['Continue'],
        },
        {
            content:
                "Once the cycle was over I was the cleanest leaf in the joint. I never looked shinier or smelled fresher! Well, it's always important to try and find the positives from any situation. They are always there if you look for them!",
            options: ['End story'],
        },
    ],
    story24: [
        {
            content:
                "Even though summer is a popular season it is quite a hard time for me. I get lazy when it's super hot. I don't want to move my little limbs when it's so humid out just to end up getting sweaty.",
            options: ['Tell me more'],
        },
        {
            content:
                'How does anyone find that fun? How do you feel about the high temperatures?',
            options: ['Same', 'I like summer', 'With AC now'],
        },
        {
            content:
                'Speaking of hot weather, back in 2009 my spiritual retreat to New Mexico almost ended with no return…',
            options: ['What happened?'],
        },
        {
            content: 'It was 110° F (43° C)',
            options: ['OMG 😱', 'Cannot believe it', 'You are lucky'],
        },
        {
            content:
                "I could barely peel myself off the ground to even move an inch. Thankfully I met a kind lady who shared some water and shade with me. What a sweet woman! If it weren't for her I would've ended up a crispy leaf 🍂",
            imageUrl: `${APP_ASSETS_DISTRIBUTION_URL}/eddii_at_desert.png`,
            options: ['Continue'],
        },
        {
            content:
                'I felt so grateful. While it may have only been a simple gesture from her, it meant the world to me at that moment! It made such an impact on me during a desperate time; ever since then I always make sure to help others if I can.',
            options: ['Me too', 'Nice!'],
        },
        {
            content:
                'Not only can your small gesture actually be the biggest help to someone, but it may inspire them to pass it on. Not to mention, helping someone else can sometimes be the perfect medicine to lift up your own spirits!',
            options: ['End story'],
        },
    ],
    story25: [
        {
            content:
                'My friend, Mr. Squirrel, is late right now so I am just sitting on a branch waiting for him.',
            options: ['New York traffic!', 'Tardy squirrel'],
        },
        {
            content:
                'I keep checking the time, hoping he will show up soon. Only three minutes have passed but it actually feels like thirty-three have gone by! Where is he!',
            options: ['Continue'],
        },
        {
            content:
                "But as I just picked up my head, I couldn't help but notice the stunning view of the NYC skyline.",
            options: ['Continue'],
        },
        {
            content:
                'When was the last time you sat down and took in your surroundings, enjoying that inner peace for a moment?',
            options: ['Long time ago', 'Always'],
        },
        {
            content:
                'Nowadays, people are always on the go — walking, talking, working, checking our phones — rarely do we have a minute to ourselves.',
            options: ['TRUE', 'Me too!'],
        },
        {
            content:
                "I try and treasure these moments when I can. In fact, I think when Mr. Squirrel shows up I'm actually going to thank him for being late.",
            options: ['End story'],
        },
    ],
    story26: [
        {
            content:
                'Hey there! Did I ever tell you about the mysterious library I stumbled upon one rainy evening? 📚🌧️',
            options: ['No, tell me more', 'Not interested'],
        },
        {
            content:
                'Well, it all began when I got caught in a sudden downpour while exploring the forest. I took shelter in an old tree and ended up discovering a hidden door. Should I go on?',
            options: ['Yes, please continue', "No, it's okay"],
        },
        {
            content:
                'When I entered the library, I found books that seemed to be from different dimensions! Each book had its own portal, leading to places beyond imagination. Should I dare to open one?',
            options: ['Definitely, open one!'],
        },
        {
            content:
                'So, I chose a book, and poof! I was in a world of talking animals, enchanted forests, and floating islands. It was like stepping into a fairytale. Can you believe it? 📖✨',
            options: ['Wow, what happened next?'],
        },
        {
            content:
                'I explored this magical land and met a friendly talking squirrel named Nutty. Nutty needed help collecting acorns for the Great Acorn Festival. Should I lend a hand?',
            options: ['Of course, help Nutty!'],
        },
        {
            content:
                'Together, Nutty and I embarked on a thrilling acorn-gathering adventure. We faced challenges, outsmarted cunning foxes, and even solved riddles from wise old owls! 🦉🌟',
            options: ['That sounds amazing!'],
        },
        {
            content:
                'After gathering enough acorns, Nutty and I joined the Great Acorn Festival. It was a dazzling celebration with acorn-themed dances and acorn-inspired delicacies. Would you like to join the festival too?',
            options: ['Sounds like fun!'],
        },
        {
            content:
                'Finally, it was time to return to the library, and I waved goodbye to my new friend Nutty and the enchanting world. Back in the library, I chose another book to explore. Want to hear about my next adventure?',
            options: ['Yes, please tell me!'],
        },
        {
            content:
                "And that's how I stumbled upon the mysterious library on that rainy evening. It was a magical escape into different worlds! 🪄🌍",
            options: ['What a fantastic adventure!'],
        },
    ],
};

export const getStory = (): {
    story: { content: string; options: string[] }[];
    index: number;
} => {
    const index = Math.floor(Math.random() * Object.keys(STORIES).length);
    return {
        story: STORIES[Object.keys(STORIES)[index]],
        index,
    };
};

export const getSpecificStory = (
    index: number,
): { content: string; options: string[] }[] => {
    return STORIES[Object.keys(STORIES)[index]];
};

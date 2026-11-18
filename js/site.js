// This file contains the interactive parts of the Off Route 66 Carwash site
(function ()
{
  'use strict';

  // Section: Config (edit prices, hours, times, photos and wording here)
  const Config =
  {
    Currency: 'R',

    // Sample opening hours, Sunday first; null means closed that day
    Hours:
    [
      { Open: '08:00', Close: '13:00' },
      { Open: '07:30', Close: '17:30' },
      { Open: '07:30', Close: '17:30' },
      { Open: '07:30', Close: '17:30' },
      { Open: '07:30', Close: '17:30' },
      { Open: '07:30', Close: '17:30' },
      { Open: '08:00', Close: '16:00' }
    ],

    // Minutes between booking slots
    SlotStep: 30,

    Sizes:
    [
      { Id: 'car', Label: 'Hatch or sedan', Phrase: 'a hatch or sedan' },
      { Id: 'suv', Label: 'SUV or bakkie', Phrase: 'an SUV or bakkie' },
      { Id: 'van', Label: 'Minibus or van', Phrase: 'a minibus or van' }
    ],

    // Stops is how many route stops the wash covers, counted from the first
    // Photos are free Unsplash samples; swap in your own
    Washes:
    [
      {
        Id: 'pit', Name: 'Pit Stop', Tag: 'Outside', Line: 'Exterior wash and dry.', Mins: 20, Stops: 4,
        Price: { car: 120, suv: 160, van: 200 },
        Photo: 'https://images.unsplash.com/photo-1608506375591-b90e1f955e4b?auto=format&fit=crop&w=900&q=70',
        Alt: 'Foam being sprayed onto a black car'
      },
      {
        Id: 'cruiser', Name: 'Cruiser', Tag: 'Inside and out', Line: 'Exterior, plus vacuum, dash and windows inside.', Mins: 40, Stops: 5,
        Price: { car: 220, suv: 270, van: 330 },
        Photo: 'https://images.unsplash.com/photo-1652860316277-370ca5b1b1df?auto=format&fit=crop&w=900&q=70',
        Alt: 'Clean car interior with light leather seats'
      },
      {
        Id: 'mother', Name: 'Mother Road', Tag: 'The full run', Line: 'The full run: exterior, interior and a hand wax.', Mins: 75, Stops: 6,
        Price: { car: 450, suv: 530, van: 620 },
        Photo: 'https://images.unsplash.com/photo-1611239179213-d972da54091a?auto=format&fit=crop&w=900&q=70',
        Alt: 'Water beading on freshly waxed white paint'
      }
    ],

    Extras:
    [
      { Id: 'tyre', Label: 'Tyre shine', Price: 40, Mins: 5 },
      { Id: 'engine', Label: 'Engine bay clean', Price: 150, Mins: 20 },
      { Id: 'leather', Label: 'Leather treatment', Price: 180, Mins: 20 },
      { Id: 'lights', Label: 'Headlight restore', Price: 200, Mins: 25 }
    ],

    Stops:
    [
      { Name: 'Pre-rinse', Body: 'Low-pressure water takes off loose dust and grit before anything touches the paint.' },
      { Name: 'Snow foam', Body: 'Thick foam sits on the car for a few minutes and loosens road film, so the paint needs less scrubbing.' },
      { Name: 'Hand wash', Body: 'Washed by hand with microfibre mitts and two buckets. Wheels and arches get their own mitt.' },
      { Name: 'Dry', Body: 'Blown off, then towel dried, door shuts and mirrors included, so it leaves without water marks.' },
      { Name: 'Interior', Body: 'Seats, carpets and boot vacuumed. Dash wiped down and the windows cleaned on the inside.' },
      { Name: 'Hand wax', Body: 'A coat of wax goes on by hand and gets buffed off. It adds gloss and makes the next wash quicker.' }
    ],

    DefaultWash: 'cruiser',
    DefaultSize: 'car',
    Fallback: 'images/placeholder.svg',
    Address: '[YOUR STREET ADDRESS]',

    // Map pin: right-click your spot in Google Maps to copy its numbers
    // Sample pin in Johannesburg; replace with the carwash's location
    Location: { Lat: -26.2041, Lng: 28.0473, Zoom: 15 }
  };

  // Smooth scroller, set up in InitMotion when motion is allowed
  let Smooth = null;

  const DayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const DayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


  // Section: Helpers

  // The Find function returns the first element matching a selector
  function Find(Selector, Root)
  {
    return (Root || document).querySelector(Selector);
  }

  // The FindAll function returns every element matching a selector as an array
  function FindAll(Selector, Root)
  {
    return Array.from((Root || document).querySelectorAll(Selector));
  }

  // The Make function builds an element with attributes and children
  function Make(Tag, Attrs)
  {
    const Node = document.createElement(Tag);
    const Children = Array.prototype.slice.call(arguments, 2);

    Object.keys(Attrs || {}).forEach(function (Key)
    {
      if (Attrs[Key] !== null && Attrs[Key] !== undefined && Attrs[Key] !== false)
      {
        Node.setAttribute(Key, Attrs[Key]);
      }
    });

    Children.forEach(function (Child)
    {
      if (Child === null || Child === undefined)
      {
        return;
      }
      Node.append(Child.nodeType ? Child : document.createTextNode(String(Child)));
    });

    return Node;
  }

  // The Money function formats an amount in rand
  function Money(Amount)
  {
    return Config.Currency + Amount;
  }

  // The Duration function turns minutes into readable time
  function Duration(Mins)
  {
    if (Mins < 60)
    {
      return Mins + ' minutes';
    }
    const Hours = Math.floor(Mins / 60);
    const Rest = Mins % 60;
    return Hours + ' hr' + (Rest ? ' ' + Rest + ' min' : '');
  }

  // The Pad function puts a leading zero on single digits
  function Pad(Number)
  {
    return String(Number).padStart(2, '0');
  }

  // The ToMinutes function turns "07:30" into minutes after midnight
  function ToMinutes(Text)
  {
    const Parts = Text.split(':').map(Number);
    return Parts[0] * 60 + Parts[1];
  }

  // The ToClock function turns minutes after midnight into "07:30"
  function ToClock(Mins)
  {
    return Pad(Math.floor(Mins / 60)) + ':' + Pad(Mins % 60);
  }

  // The DateKey function turns a date into "2026-10-16"
  function DateKey(Day)
  {
    return Day.getFullYear() + '-' + Pad(Day.getMonth() + 1) + '-' + Pad(Day.getDate());
  }

  // The FromKey function turns "2026-10-16" into a local date
  function FromKey(Key)
  {
    const Parts = Key.split('-').map(Number);
    return new Date(Parts[0], Parts[1] - 1, Parts[2]);
  }

  // The FindWash function returns a wash by id, or the default wash
  function FindWash(Id)
  {
    return Config.Washes.find(function (Wash) { return Wash.Id === Id; })
      || Config.Washes.find(function (Wash) { return Wash.Id === Config.DefaultWash; })
      || Config.Washes[0];
  }

  // The FindSize function returns a vehicle size by id, or the first size
  function FindSize(Id)
  {
    return Config.Sizes.find(function (Size) { return Size.Id === Id; }) || Config.Sizes[0];
  }

  // The LowestPrice function returns the cheapest price of a wash
  function LowestPrice(Wash)
  {
    return Math.min.apply(null, Object.keys(Wash.Price).map(function (Key) { return Wash.Price[Key]; }));
  }

  // The ListText function joins words as "a, b and c"
  function ListText(Items)
  {
    if (Items.length < 2)
    {
      return Items.join('');
    }
    return Items.slice(0, -1).join(', ') + ' and ' + Items[Items.length - 1];
  }

  // The SetOn function switches an option button on or off
  function SetOn(Button, On)
  {
    Button.classList.toggle('is-on', On);
    Button.setAttribute('aria-pressed', On ? 'true' : 'false');
  }

  // The ReducedMotion function checks the visitor's motion setting
  function ReducedMotion()
  {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // The MiniRoute function draws the six-segment bar showing a wash's stops
  function MiniRoute(Wash)
  {
    const Bar = Make('div', { class: 'mini-route', role: 'img', 'aria-label': 'Covers ' + Wash.Stops + ' of ' + Config.Stops.length + ' stops' });
    Config.Stops.forEach(function (Stop, Index)
    {
      Bar.append(Make('span', { class: Index < Wash.Stops ? 'is-in' : null }));
    });
    return Bar;
  }


  // Section: Photos

  // The UseFallback function swaps a photo that failed to load for the placeholder
  function UseFallback(Image)
  {
    if (Image.dataset.fellBack)
    {
      return;
    }
    Image.dataset.fellBack = 'yes';
    Image.src = Image.dataset.fallback || Config.Fallback;
  }

  // The InitPhotos function watches every photo so a broken link shows the placeholder
  function InitPhotos(Root)
  {
    FindAll('img[data-fallback]', Root).forEach(function (Image)
    {
      if (Image.complete && Image.naturalWidth === 0 && Image.getAttribute('src'))
      {
        UseFallback(Image);
        return;
      }
      Image.addEventListener('error', function () { UseFallback(Image); });
    });
  }

  // The InitDuotone function adds a true-colour copy to duotone photos that reveal on hover
  function InitDuotone(Root)
  {
    FindAll('.duo--reveal', Root).forEach(function (Box)
    {
      const Image = Find('img', Box);
      if (!Image || Find('.duo-color', Box))
      {
        return;
      }
      const Copy = Image.cloneNode();
      Copy.classList.add('duo-color');
      Copy.alt = '';
      Copy.removeAttribute('data-full');
      Copy.setAttribute('aria-hidden', 'true');
      Box.append(Copy);
      InitPhotos(Box);
    });
  }


  // Section: Navigation and trip bar

  // The InitNav function opens and closes the phone menu
  function InitNav()
  {
    const Toggle = Find('.nav-toggle');
    const Nav = Find('#site-nav');
    if (!Toggle || !Nav)
    {
      return;
    }

    Toggle.addEventListener('click', function ()
    {
      const Open = Nav.classList.toggle('is-open');
      Toggle.setAttribute('aria-expanded', Open ? 'true' : 'false');
      Toggle.textContent = Open ? 'Close' : 'Menu';
    });
  }

  // The InitTrip function moves the little car along the header as the page scrolls
  function InitTrip()
  {
    const Fill = Find('[data-trip-fill]');
    const Car = Find('[data-trip-car]');
    if (!Fill || !Car)
    {
      return;
    }
    let Waiting = false;

    // The Draw function sets the bar and car to the current scroll position
    function Draw()
    {
      const Room = document.documentElement.scrollHeight - window.innerHeight;
      const Progress = Room > 0 ? Math.min(1, Math.max(0, window.scrollY / Room)) : 0;
      Fill.style.transform = 'scaleX(' + Progress + ')';
      Car.style.left = (Progress * 100) + '%';
      Waiting = false;
    }

    window.addEventListener('scroll', function ()
    {
      if (!Waiting)
      {
        Waiting = true;
        requestAnimationFrame(Draw);
      }
    }, { passive: true });
    window.addEventListener('resize', Draw);
    Draw();
  }


  // Section: Opening hours

  // The HoursFor function returns the hours for a date, or null when closed
  function HoursFor(Day)
  {
    return Config.Hours[Day.getDay()];
  }

  // The NextOpening function finds when the carwash next opens after a moment
  function NextOpening(Now)
  {
    for (let Ahead = 0; Ahead < 8; Ahead += 1)
    {
      const Day = new Date(Now.getFullYear(), Now.getMonth(), Now.getDate() + Ahead);
      const Hours = HoursFor(Day);
      if (!Hours)
      {
        continue;
      }
      const NowMins = Now.getHours() * 60 + Now.getMinutes();
      if (Ahead > 0 || NowMins < ToMinutes(Hours.Open))
      {
        const When = Ahead === 0 ? 'today' : Ahead === 1 ? 'tomorrow' : DayNames[Day.getDay()];
        return 'Opens ' + When + ' at ' + Hours.Open;
      }
    }
    return '';
  }

  // The OpenState function says whether the carwash is open right now
  function OpenState()
  {
    const Now = new Date();
    const Hours = HoursFor(Now);
    const NowMins = Now.getHours() * 60 + Now.getMinutes();
    if (Hours && NowMins >= ToMinutes(Hours.Open) && NowMins < ToMinutes(Hours.Close))
    {
      return { Open: true, Note: 'Open now, closes at ' + Hours.Close };
    }
    return { Open: false, Note: 'Closed now. ' + NextOpening(Now) };
  }

  // The HoursSummary function groups days with the same hours, like "Mon to Fri 07:30 to 17:30"
  function HoursSummary()
  {
    const Order = [1, 2, 3, 4, 5, 6, 0];
    const Groups = [];
    Order.forEach(function (Index)
    {
      const Hours = Config.Hours[Index];
      const Text = Hours ? Hours.Open + ' to ' + Hours.Close : 'Closed';
      const Last = Groups[Groups.length - 1];
      if (Last && Last.Text === Text)
      {
        Last.End = Index;
      }
      else
      {
        Groups.push({ Start: Index, End: Index, Text: Text });
      }
    });
    return Groups.map(function (Group)
    {
      const Days = Group.Start === Group.End ? DayShort[Group.Start] : DayShort[Group.Start] + ' to ' + DayShort[Group.End];
      return Days + ' ' + Group.Text;
    });
  }

  // The InitHours function fills every open sign, hours summary and hours table
  function InitHours()
  {
    const State = OpenState();

    FindAll('[data-open-sign]').forEach(function (Sign)
    {
      Sign.textContent = State.Open ? 'Open' : 'Closed';
      Sign.classList.toggle('is-open', State.Open);
      Sign.classList.toggle('is-closed', !State.Open);
    });

    FindAll('[data-open-note]').forEach(function (Note)
    {
      Note.textContent = State.Note;
    });

    FindAll('[data-hours-summary]').forEach(function (Box)
    {
      Box.textContent = '';
      HoursSummary().forEach(function (Line, Index)
      {
        if (Index > 0)
        {
          Box.append(Make('br'));
        }
        Box.append(Line);
      });
    });

    FindAll('[data-hours-table]').forEach(function (Body)
    {
      Body.textContent = '';
      const Today = new Date().getDay();
      [1, 2, 3, 4, 5, 6, 0].forEach(function (Index)
      {
        const Hours = Config.Hours[Index];
        Body.append(
          Make('tr', { class: Index === Today ? 'is-today' : null },
            Make('th', { scope: 'row' }, DayNames[Index] + (Index === Today ? ' (today)' : '')),
            Make('td', null, Hours ? Hours.Open + ' to ' + Hours.Close : 'Closed')
          )
        );
      });
    });
  }


  // Section: Home wash cards

  // The InitWashCards function fills the home page with one card per wash
  function InitWashCards()
  {
    const Holder = Find('[data-wash-cards]');
    if (!Holder)
    {
      return;
    }

    Config.Washes.forEach(function (Wash)
    {
      Holder.append(
        Make('article', { class: 'card wash-card' },
          Make('div', { class: 'duo wash-media' },
            Make('img', { src: Wash.Photo, alt: Wash.Alt, loading: 'lazy', 'data-fallback': Config.Fallback })
          ),
          Make('span', { class: 'tag' }, Wash.Tag),
          Make('h3', { class: 'h-card' }, Wash.Name),
          Make('p', null, Wash.Line),
          MiniRoute(Wash),
          Make('div', { class: 'wash-meta' },
            Make('span', { class: 'plate' }, 'From ' + Money(LowestPrice(Wash))),
            Make('span', { class: 'caption' }, Duration(Wash.Mins))
          ),
          Make('a', { class: 'btn btn--outline btn--block', href: 'book.html?wash=' + Wash.Id }, 'Book the ' + Wash.Name)
        )
      );
    });
    InitPhotos(Holder);
  }


  // Section: Route

  // The InitRoute function runs the wash switch, the stops and the car
  function InitRoute()
  {
    const Root = Find('[data-route]');
    if (!Root)
    {
      return;
    }

    const WashHolder = Find('[data-route-washes]', Root);
    const StopHolder = Find('[data-route-stops]', Root);
    const Car = Find('[data-route-car]', Root);
    const Title = Find('[data-stop-title]', Root);
    const Body = Find('[data-stop-body]', Root);
    const Note = Find('[data-stop-note]', Root);
    const BookLink = Find('[data-route-book]', Root);
    const State = { Wash: Config.DefaultWash, Stop: 0 };

    const WashButtons = Config.Washes.map(function (Wash)
    {
      const Button = Make('button', { class: 'opt', type: 'button' }, Wash.Name);
      Button.addEventListener('click', function ()
      {
        StopTour();
        State.Wash = Wash.Id;
        Update();
      });
      WashHolder.append(Button);
      return Button;
    });

    const StopButtons = Config.Stops.map(function (Stop, Index)
    {
      const Button = Make('button', { class: 'stop', type: 'button' },
        Make('span', { class: 'stop-dot' }, Index + 1),
        Make('span', null, Stop.Name)
      );
      Button.addEventListener('click', function ()
      {
        StopTour();
        State.Stop = Index;
        Update();
      });
      StopHolder.append(Button);
      return Button;
    });

    // The NoteFor function says whether the chosen wash covers a stop
    function NoteFor(Wash, Index)
    {
      if (Index < Wash.Stops)
      {
        return 'Part of the ' + Wash.Name + '.';
      }
      const Having = Config.Washes
        .filter(function (Other) { return Index < Other.Stops; })
        .map(function (Other) { return 'the ' + Other.Name; });
      if (Having.length === 0)
      {
        return 'Not part of the ' + Wash.Name + '.';
      }
      if (Having.length === 1)
      {
        return 'Not part of the ' + Wash.Name + '. Only ' + Having[0] + ' includes it.';
      }
      const First = ListText(Having);
      return 'Not part of the ' + Wash.Name + '. ' + First.charAt(0).toUpperCase() + First.slice(1) + ' include it.';
    }

    // The Update function redraws the route for the current state
    function Update()
    {
      const Wash = FindWash(State.Wash);
      const Stop = Config.Stops[State.Stop];

      WashButtons.forEach(function (Button, Index)
      {
        SetOn(Button, Config.Washes[Index].Id === Wash.Id);
      });

      StopButtons.forEach(function (Button, Index)
      {
        Button.classList.toggle('is-in', Index < Wash.Stops);
        Button.classList.toggle('is-here', Index === State.Stop);
        Button.setAttribute('aria-pressed', Index === State.Stop ? 'true' : 'false');
      });

      Car.style.left = ((State.Stop + 0.5) / Config.Stops.length * 100) + '%';
      Title.textContent = Stop.Name;
      Body.textContent = Stop.Body;
      Note.textContent = NoteFor(Wash, State.Stop);
      Note.classList.toggle('is-in', State.Stop < Wash.Stops);

      if (BookLink)
      {
        BookLink.href = 'book.html?wash=' + Wash.Id;
        Find('[data-route-book-label]', BookLink).textContent = 'Book the ' + Wash.Name;
      }
    }

    let Tour = null;

    // The StopTour function ends the automatic drive once the visitor takes over
    function StopTour()
    {
      if (Tour)
      {
        clearInterval(Tour);
        Tour = null;
      }
    }

    // The StartTour function drives the car through the chosen wash's stops once
    function StartTour()
    {
      const Last = FindWash(State.Wash).Stops - 1;
      Tour = setInterval(function ()
      {
        if (State.Stop >= Last)
        {
          StopTour();
          return;
        }
        State.Stop += 1;
        Update();
      }, 1100);
    }

    Update();

    if (!ReducedMotion() && 'IntersectionObserver' in window)
    {
      const Watch = new IntersectionObserver(function (Entries)
      {
        if (Entries[0].isIntersecting)
        {
          Watch.disconnect();
          setTimeout(StartTour, 500);
        }
      }, { threshold: 0.6 });
      Watch.observe(Find('.route-track', Root));
    }
  }


  // Section: Wash builder and booking

  // The InitBuilder function runs the wash builder, the summary, the time slots and the booking ticket
  function InitBuilder()
  {
    const Root = Find('[data-builder]');
    if (!Root)
    {
      return;
    }

    const Params = new URLSearchParams(window.location.search);
    const State =
    {
      Size: Config.DefaultSize,
      Wash: FindWash(Params.get('wash')).Id,
      Extras: {}
    };

    const SizeButtons = Config.Sizes.map(function (Size)
    {
      const Button = Make('button', { class: 'opt', type: 'button' }, Size.Label);
      Button.addEventListener('click', function ()
      {
        State.Size = Size.Id;
        Update();
      });
      Find('[data-sizes]', Root).append(Button);
      return Button;
    });

    const WashPlates = [];
    const WashButtons = Config.Washes.map(function (Wash)
    {
      const Plate = Make('span', { class: 'plate' });
      WashPlates.push(Plate);
      const Button = Make('button', { class: 'opt opt--wash', type: 'button' },
        Make('span', { class: 'opt-main' },
          Make('span', { class: 'opt-name' }, Wash.Name),
          Make('span', { class: 'opt-note' }, Wash.Line)
        ),
        Make('span', { class: 'opt-side' },
          Plate,
          Make('span', { class: 'opt-note' }, Duration(Wash.Mins))
        )
      );
      Button.addEventListener('click', function ()
      {
        State.Wash = Wash.Id;
        Update();
      });
      Find('[data-washes]', Root).append(Button);
      return Button;
    });

    const Tick = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5 L10 17.5 L19 7"></path></svg>';
    const ExtraButtons = Config.Extras.map(function (Extra)
    {
      const Box = Make('span', { class: 'opt-box' });
      Box.innerHTML = Tick;
      const Button = Make('button', { class: 'opt opt--extra', type: 'button' },
        Box,
        Make('span', { class: 'opt-label' }, Extra.Label),
        Make('span', { class: 'opt-note' }, '+' + Money(Extra.Price))
      );
      Button.addEventListener('click', function ()
      {
        State.Extras[Extra.Id] = !State.Extras[Extra.Id];
        Update();
      });
      Find('[data-extras]', Root).append(Button);
      return Button;
    });

    // The Totals function works out the chosen wash, size, extras, price and time
    function Totals()
    {
      const Wash = FindWash(State.Wash);
      const Size = FindSize(State.Size);
      const Chosen = Config.Extras.filter(function (Extra) { return State.Extras[Extra.Id]; });
      return {
        Wash: Wash,
        Size: Size,
        Chosen: Chosen,
        Total: Wash.Price[Size.Id] + Chosen.reduce(function (Sum, Extra) { return Sum + Extra.Price; }, 0),
        Mins: Wash.Mins + Chosen.reduce(function (Sum, Extra) { return Sum + Extra.Mins; }, 0)
      };
    }

    // The Sum function finds one value slot in the summary card
    function Sum(Name)
    {
      return Find('[data-sum="' + Name + '"]');
    }

    const Recap = Find('[data-recap]');
    const Form = Find('[data-booking-form]');
    const Ticket = Find('[data-ticket]');

    // The Update function redraws the options, summary, recap and time slots
    function Update()
    {
      const T = Totals();
      const ExtraNames = T.Chosen.map(function (Extra) { return Extra.Label; });

      SizeButtons.forEach(function (Button, Index) { SetOn(Button, Config.Sizes[Index].Id === T.Size.Id); });
      WashButtons.forEach(function (Button, Index) { SetOn(Button, Config.Washes[Index].Id === T.Wash.Id); });
      ExtraButtons.forEach(function (Button, Index) { SetOn(Button, !!State.Extras[Config.Extras[Index].Id]); });
      WashPlates.forEach(function (Plate, Index) { Plate.textContent = Money(Config.Washes[Index].Price[T.Size.Id]); });

      Sum('wash').textContent = T.Wash.Name;
      Sum('size').textContent = T.Size.Label;
      Sum('extras').textContent = ExtraNames.length ? ExtraNames.join(', ') : 'None';
      Sum('time').textContent = 'About ' + Duration(T.Mins);
      Sum('total').textContent = Money(T.Total);

      if (Recap)
      {
        const WithExtras = ExtraNames.length ? ', with ' + ListText(ExtraNames).toLowerCase() : '';
        Recap.textContent = 'You are booking the ' + T.Wash.Name + ' for ' + T.Size.Phrase + WithExtras + '. '
          + Money(T.Total) + ', about ' + Duration(T.Mins) + '.';
      }

      if (Form)
      {
        FillSlots();
      }
    }

    if (!Form || !Ticket)
    {
      Update();
      return;
    }

    // The form only shows a ticket; send Booking to your server to keep it
    const ErrorBox = Find('[data-form-error]', Form);
    const DayInput = Form.elements.day;
    const TimeSelect = Form.elements.time;
    const SlotNote = Find('[data-slot-note]', Form);

    DayInput.min = DateKey(new Date());
    DayInput.max = DateKey(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));

    // The FillSlots function lists start times that let the wash finish before closing
    function FillSlots()
    {
      const Picked = TimeSelect.value;
      TimeSelect.textContent = '';

      if (!DayInput.value)
      {
        TimeSelect.append(Make('option', { value: '' }, 'Pick a day first'));
        TimeSelect.disabled = true;
        SlotNote.hidden = true;
        return;
      }

      const Day = FromKey(DayInput.value);
      const Hours = HoursFor(Day);
      const Length = Totals().Mins;

      if (!Hours)
      {
        TimeSelect.append(Make('option', { value: '' }, 'Closed'));
        TimeSelect.disabled = true;
        SlotNote.textContent = 'We are closed on ' + DayNames[Day.getDay()] + 's. Pick another day.';
        SlotNote.hidden = false;
        return;
      }

      const Now = new Date();
      const IsToday = DateKey(Now) === DayInput.value;
      const Earliest = IsToday ? Now.getHours() * 60 + Now.getMinutes() + Config.SlotStep : 0;
      const Slots = [];
      for (let Start = ToMinutes(Hours.Open); Start + Length <= ToMinutes(Hours.Close); Start += Config.SlotStep)
      {
        if (Start >= Earliest)
        {
          Slots.push(ToClock(Start));
        }
      }

      if (!Slots.length)
      {
        TimeSelect.append(Make('option', { value: '' }, 'No times left'));
        TimeSelect.disabled = true;
        SlotNote.textContent = 'No times left that day for a ' + Duration(Length) + ' wash. Pick another day.';
        SlotNote.hidden = false;
        return;
      }

      Slots.forEach(function (Slot)
      {
        TimeSelect.append(Make('option', { value: Slot, selected: Slot === Picked ? 'selected' : false }, Slot));
      });
      TimeSelect.disabled = false;
      SlotNote.textContent = 'Last start time is ' + Slots[Slots.length - 1] + ', so the wash finishes by closing at ' + Hours.Close + '.';
      SlotNote.hidden = false;
    }

    Update();

    DayInput.addEventListener('change', FillSlots);

    Form.addEventListener('input', function ()
    {
      ErrorBox.hidden = true;
    });

    // The MakeRef function builds a short booking reference like OR66-1024-4821
    function MakeRef(Day)
    {
      return 'OR66-' + Pad(Day.getMonth() + 1) + Pad(Day.getDate()) + '-' + String(Math.floor(1000 + Math.random() * 9000));
    }

    // The CalendarFile function builds an .ics file so the booking can go in a calendar
    function CalendarFile(Booking)
    {
      const Start = FromKey(Booking.Day);
      const StartMins = ToMinutes(Booking.Time);
      Start.setHours(Math.floor(StartMins / 60), StartMins % 60, 0, 0);
      const End = new Date(Start.getTime() + Booking.Mins * 60000);

      // The Stamp function writes a date the way calendar files expect
      function Stamp(When)
      {
        return When.getFullYear() + Pad(When.getMonth() + 1) + Pad(When.getDate()) + 'T' + Pad(When.getHours()) + Pad(When.getMinutes()) + '00';
      }

      const Lines =
      [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Off Route 66 Carwash//Booking//EN',
        'BEGIN:VEVENT',
        'UID:' + Booking.Ref + '@offroute66',
        'DTSTAMP:' + Stamp(new Date()),
        'DTSTART:' + Stamp(Start),
        'DTEND:' + Stamp(End),
        'SUMMARY:' + Booking.WashName + ' at Off Route 66 Carwash',
        'LOCATION:' + Config.Address,
        'DESCRIPTION:Booking ' + Booking.Ref + '. ' + Money(Booking.Total) + '.',
        'END:VEVENT',
        'END:VCALENDAR'
      ];
      return URL.createObjectURL(new Blob([Lines.join('\r\n')], { type: 'text/calendar' }));
    }

    Form.addEventListener('submit', function (Event)
    {
      Event.preventDefault();

      const Name = Form.elements.name.value.trim();
      const Phone = Form.elements.phone.value.trim();
      const Day = DayInput.value;
      const Time = TimeSelect.value;

      const Missing = [];
      if (!Name) { Missing.push('your name'); }
      if (!Phone) { Missing.push('a phone number'); }
      if (!Day) { Missing.push('a day'); }
      else if (!Time) { Missing.push('a day with open times'); }

      if (Missing.length)
      {
        ErrorBox.textContent = 'Add ' + ListText(Missing) + ' to confirm the booking.';
        ErrorBox.hidden = false;
        return;
      }

      const T = Totals();
      const DayDate = FromKey(Day);
      const Booking =
      {
        Ref: MakeRef(DayDate),
        Name: Name,
        Phone: Phone,
        Day: Day,
        Time: Time,
        Wash: T.Wash.Id,
        WashName: T.Wash.Name,
        Size: T.Size.Id,
        Extras: T.Chosen.map(function (Extra) { return Extra.Id; }),
        Total: T.Total,
        Mins: T.Mins
      };
      // Send Booking to your server here, for example with fetch to a Flask route

      const DayText = DayDate.toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' });
      const ExtraNames = T.Chosen.map(function (Extra) { return Extra.Label.toLowerCase(); });

      Find('[data-ticket-name]', Ticket).textContent = Name + ', you are booked in.';
      Find('[data-ticket-wash]', Ticket).textContent = T.Wash.Name + (ExtraNames.length ? ' with ' + ListText(ExtraNames) : '');
      Find('[data-ticket-vehicle]', Ticket).textContent = T.Size.Label;
      Find('[data-ticket-day]', Ticket).textContent = DayText;
      Find('[data-ticket-time]', Ticket).textContent = Time + ', about ' + Duration(T.Mins);
      Find('[data-ticket-ref]', Ticket).textContent = Booking.Ref;
      Find('[data-ticket-total]', Ticket).textContent = Money(T.Total);

      const CalendarLink = Find('[data-ticket-calendar]', Ticket);
      CalendarLink.href = CalendarFile(Booking);
      CalendarLink.download = 'off-route-66-' + Booking.Ref + '.ics';

      Form.hidden = true;
      Ticket.hidden = false;
      Ticket.focus();
    });

    Find('[data-book-another]', Ticket).addEventListener('click', function ()
    {
      Form.reset();
      ErrorBox.hidden = true;
      Ticket.hidden = true;
      Form.hidden = false;
      FillSlots();
      Form.elements.name.focus();
    });
  }


  // Section: Gallery

  // The InitGallery function runs the filters, the lightbox and the before and after slider
  function InitGallery()
  {
    const Filters = FindAll('[data-filter]');
    const Photos = FindAll('.photo[data-cat]');

    Filters.forEach(function (Button)
    {
      Button.addEventListener('click', function ()
      {
        const Wanted = Button.dataset.filter;
        Filters.forEach(function (Other) { SetOn(Other, Other === Button); });
        Photos.forEach(function (Photo)
        {
          Photo.hidden = Wanted !== 'all' && Photo.dataset.cat !== Wanted;
        });
      });
    });

    const Lightbox = Find('[data-lightbox]');
    if (Lightbox)
    {
      const BigImage = Find('img', Lightbox);
      const Caption = Find('[data-lightbox-caption]', Lightbox);
      const Count = Find('[data-lightbox-count]', Lightbox);
      let Current = [];
      let Index = 0;

      // The Show function puts one photo from the visible set in the lightbox
      function Show(At)
      {
        Index = (At + Current.length) % Current.length;
        const Button = Current[Index];
        const Image = Find('img', Button);
        const Figcaption = Find('figcaption', Button.closest('.photo'));
        BigImage.dataset.fellBack = '';
        BigImage.src = Image.dataset.fellBack ? Image.src : (Image.dataset.full || Image.src);
        BigImage.alt = Image.alt;
        Caption.textContent = Figcaption ? Figcaption.textContent.trim() : '';
        Count.textContent = (Index + 1) + ' of ' + Current.length;
      }

      BigImage.addEventListener('error', function () { UseFallback(BigImage); });

      FindAll('button.photo-btn').forEach(function (Button)
      {
        Button.addEventListener('click', function ()
        {
          Current = FindAll('button.photo-btn').filter(function (Other) { return !Other.closest('.photo').hidden; });
          Show(Current.indexOf(Button));
          Lightbox.showModal();
          if (Smooth)
          {
            Smooth.stop();
          }
        });
      });

      Find('[data-lightbox-prev]', Lightbox).addEventListener('click', function () { Show(Index - 1); });
      Find('[data-lightbox-next]', Lightbox).addEventListener('click', function () { Show(Index + 1); });
      Find('[data-lightbox-close]', Lightbox).addEventListener('click', function () { Lightbox.close(); });

      Lightbox.addEventListener('close', function ()
      {
        if (Smooth)
        {
          Smooth.start();
        }
      });

      Lightbox.addEventListener('keydown', function (Event)
      {
        if (Event.key === 'ArrowLeft') { Show(Index - 1); }
        if (Event.key === 'ArrowRight') { Show(Index + 1); }
      });

      Lightbox.addEventListener('click', function (Event)
      {
        if (Event.target === Lightbox)
        {
          Lightbox.close();
        }
      });
    }

    FindAll('[data-compare]').forEach(function (Compare)
    {
      const Range = Find('input[type="range"]', Compare);

      // The Move function moves the dividing line to the slider value
      function Move()
      {
        Compare.style.setProperty('--pos', Range.value + '%');
      }

      Range.addEventListener('input', Move);
      Move();
    });
  }


  // Section: Map

  // The DirectionsLink function builds a Google Maps directions link to the carwash
  function DirectionsLink()
  {
    return 'https://www.google.com/maps/dir/?api=1&destination=' + Config.Location.Lat + ',' + Config.Location.Lng;
  }

  // The InitMap function draws the live map with the neon pin and fills the Google Maps buttons
  function InitMap()
  {
    const Canvas = Find('[data-map]');
    if (!Canvas)
    {
      return;
    }

    const Spot = [Config.Location.Lat, Config.Location.Lng];
    const OpenLink = Find('[data-map-open]');
    const RouteLink = Find('[data-map-directions]');
    const AddressBox = Find('[data-map-address]');

    if (OpenLink) { OpenLink.href = 'https://www.google.com/maps/search/?api=1&query=' + Spot.join(','); }
    if (RouteLink) { RouteLink.href = DirectionsLink(); }
    if (AddressBox) { AddressBox.textContent = Config.Address; }

    if (!window.L)
    {
      return;
    }

    Canvas.textContent = '';
    const Map = L.map(Canvas, {
      center: Spot,
      zoom: Config.Location.Zoom,
      scrollWheelZoom: false,
      dragging: !L.Browser.mobile,
      tap: false
    });

    // Dark map tiles from CARTO, tinted navy in the stylesheet
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    }).addTo(Map);

    const Pin = L.divIcon({
      className: '',
      html: '<div class="map-pin"><svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 7 C14 10 19 9 24 5 C29 9 34 10 40 7 C44 14 45 22 42 29 C39 36 32 41 24 44 C16 41 9 36 6 29 C3 22 4 14 8 7 Z"></path><text x="24" y="31">66</text></svg></div>',
      iconSize: [64, 64],
      iconAnchor: [32, 60],
      popupAnchor: [0, -56]
    });

    const Popup = '<b>Off Route 66</b>' + Config.Address + '<br><span data-open-note>' + OpenState().Note + '</span><br>'
      + '<a href="' + DirectionsLink() + '" target="_blank" rel="noopener">Get directions</a>';

    L.marker(Spot, { icon: Pin, keyboard: true, title: 'Off Route 66 Carwash' }).addTo(Map).bindPopup(Popup).openPopup();

    // Wheel zoom only after a click, so scrolling the page never gets stuck in the map
    Map.on('click focus', function () { Map.scrollWheelZoom.enable(); });
    Map.on('mouseout blur', function () { Map.scrollWheelZoom.disable(); });
  }


  // Section: Scroll motion

  // The InitMotion function adds smooth scrolling, scroll reveals, the moving road and rock parallax
  function InitMotion()
  {
    if (ReducedMotion())
    {
      return;
    }

    const HasGsap = window.gsap && window.ScrollTrigger;

    if (window.Lenis)
    {
      Smooth = new Lenis({ lerp: 0.09, anchors: true });
      if (HasGsap)
      {
        Smooth.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function (Time) { Smooth.raf(Time * 1000); });
        gsap.ticker.lagSmoothing(0);
      }
      else
      {
        // The Loop function feeds animation frames to the smooth scroller
        const Loop = function (Time)
        {
          Smooth.raf(Time);
          requestAnimationFrame(Loop);
        };
        requestAnimationFrame(Loop);
      }
    }

    // Road centre line slides left as you scroll down, like driving
    const Root = document.documentElement;
    let Waiting = false;

    // The ShiftRoad function moves the road dashes to match the scroll position
    function ShiftRoad()
    {
      Root.style.setProperty('--road-shift', (-window.scrollY * 0.8) + 'px');
      Waiting = false;
    }

    window.addEventListener('scroll', function ()
    {
      if (!Waiting)
      {
        Waiting = true;
        requestAnimationFrame(ShiftRoad);
      }
    }, { passive: true });

    if (!HasGsap)
    {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Hero comes in on load
    gsap.from('.hero-copy > *', { y: 28, opacity: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09, delay: 0.1 });

    // Cards, signs, photos and headings rise in as they reach the screen
    const Targets = FindAll('.section-head, .page-head-row, .step-sign, .card, .photo, .compare, .faq details')
      .filter(function (Item)
      {
        return !Item.closest('.hero') && !Item.closest('.site-footer') && !Item.parentElement.closest('.card');
      });

    gsap.set(Targets, { y: 40, opacity: 0 });
    ScrollTrigger.batch(Targets, {
      start: 'top 90%',
      once: true,
      onEnter: function (Batch)
      {
        gsap.to(Batch, { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.1, overwrite: true });
      }
    });

    // Mile markers pop up like you are passing them
    FindAll('.mile').forEach(function (Marker)
    {
      gsap.from(Marker, {
        scale: 0.4,
        rotate: -12,
        opacity: 0,
        duration: 0.6,
        ease: 'back.out(2)',
        scrollTrigger: { trigger: Marker, start: 'top 88%', once: true }
      });
    });

    // Rocks drift at different speeds for depth
    FindAll('.rocks').forEach(function (Rocks)
    {
      [['.rock-far', -26], ['.rock-mid', -12], ['.rock-lit', 0]].forEach(function (Layer)
      {
        const Shape = Find(Layer[0], Rocks);
        if (!Shape || !Layer[1])
        {
          return;
        }
        gsap.to(Shape, {
          y: Layer[1],
          ease: 'none',
          scrollTrigger: { trigger: Rocks, start: 'top bottom', end: 'bottom top', scrub: true }
        });
      });
    });

    // Giant footer wordmark slides up into place
    const Mark = Find('.footer-mark');
    if (Mark)
    {
      gsap.from(Mark, { yPercent: 45, ease: 'none', scrollTrigger: { trigger: Mark, start: 'top bottom', end: 'bottom bottom', scrub: true } });
    }

    // Measurements change once fonts and photos load
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }


  // Section: Cartoon liquid (shared by the page transition and the water bands)

  const SvgNs = 'http://www.w3.org/2000/svg';

  // The Clamp function keeps a number between 0 and 1
  function Clamp(Value)
  {
    return Math.max(0, Math.min(1, Value));
  }

  // The EaseOut function starts fast and settles
  function EaseOut(T)
  {
    return 1 - Math.pow(1 - T, 3);
  }

  // The EaseInOut function starts and ends gently
  function EaseInOut(T)
  {
    return T < 0.5 ? 4 * T * T * T : 1 - Math.pow(-2 * T + 2, 3) / 2;
  }

  // The Profile function is the shape of one drip across its width: steep sides, round end, soft shoulders
  function Profile(U)
  {
    return Math.exp(-Math.pow(Math.abs(U), 5));
  }

  // The MakeDrips function scatters a row of drips across a width
  function MakeDrips(Width, Spacing)
  {
    const Count = Math.max(5, Math.round(Width / Spacing));
    const Step = Width / Count;
    const Drips = [];
    for (let Index = 0; Index < Count; Index += 1)
    {
      Drips.push({
        C: (Index + 0.5 + (Math.random() - 0.5) * 0.6) * Step,
        W: (0.32 + Math.random() * 0.4) * Step,
        Delay: Math.random() * 0.25,
        Len: 0.25 + Math.random() * 0.4,
        Seed: Math.random() * 6.28
      });
    }
    return Drips;
  }

  // The DripDepth function adds up how far the drips reach at one point across
  function DripDepth(Drips, X, Grow, Scale)
  {
    let Depth = 0;
    Drips.forEach(function (Drip)
    {
      const Half = Drip.W * Scale;
      if (Math.abs(X - Drip.C) < Half * 1.6)
      {
        Depth += Grow(Drip) * Profile((X - Drip.C) / Half);
      }
    });
    return Depth;
  }

  // The SvgMake function creates an SVG element with attributes
  function SvgMake(Tag, Attrs)
  {
    const Node = document.createElementNS(SvgNs, Tag);
    Object.keys(Attrs || {}).forEach(function (Key) { Node.setAttribute(Key, Attrs[Key]); });
    return Node;
  }

  // The Circles function draws a set of drops into a group, reusing the circles it already has
  function Circles(Group, Drops)
  {
    while (Group.childNodes.length < Drops.length)
    {
      Group.append(SvgMake('circle'));
    }
    Array.from(Group.childNodes).forEach(function (Dot, Index)
    {
      const Drop = Drops[Index];
      if (!Drop || Drop.R <= 0.4)
      {
        Dot.setAttribute('r', 0);
        return;
      }
      Dot.setAttribute('cx', Drop.X.toFixed(1));
      Dot.setAttribute('cy', Drop.Y.toFixed(1));
      Dot.setAttribute('r', Drop.R.toFixed(1));
    });
  }


  // Section: Wash page transition

  // The BuildWash function makes the overlay: an SVG for the liquid and the floating 66 shield
  function BuildWash()
  {
    const Wash = Make('div', { class: 'wash', 'aria-hidden': 'true' });
    const Svg = SvgMake('svg', { class: 'wash-svg', preserveAspectRatio: 'none' });
    const Parts =
    {
      Rim: SvgMake('path', { class: 'rim' }),
      Liquid: SvgMake('path', { class: 'liquid' }),
      Drops: SvgMake('g', { class: 'liquid' }),
      Shine: SvgMake('g', { class: 'shine' })
    };
    Svg.append(Parts.Rim, Parts.Liquid, Parts.Drops, Parts.Shine);

    const Float = Make('div', { class: 'wash-float' });
    const Shape = 'M8 7 C14 10 19 9 24 5 C29 9 34 10 40 7 C44 14 45 22 42 29 C39 36 32 41 24 44 C16 41 9 36 6 29 C3 22 4 14 8 7 Z';
    Float.innerHTML = '<svg class="wash-shield" viewBox="0 0 48 48" aria-hidden="true">'
      + '<path class="halo" d="' + Shape + '"></path><text class="halo" x="24" y="32.5">66</text>'
      + '<path d="' + Shape + '"></path>'
      + '<path class="tube-inner" d="' + Shape + '" transform="translate(24 24.5) scale(0.84) translate(-24 -24.5)"></path>'
      + '<text x="24" y="32.5">66</text></svg>';

    Wash.append(Svg, Float);
    document.body.append(Wash);
    return { Wash: Wash, Svg: Svg, Parts: Parts, Float: Float };
  }

  // The PlayWash function animates the liquid: "pour" covers the page from the top, "clear" lets the next page pour in over it
  function PlayWash(Kit, Mode, Duration, Done)
  {
    const Width = window.innerWidth;
    const Height = window.innerHeight;
    const Drips = MakeDrips(Width, 120);
    const Started = performance.now();
    const Steps = Math.ceil(Width / 3);

    Kit.Svg.setAttribute('viewBox', '0 0 ' + Width + ' ' + Height);
    Kit.Wash.classList.add('is-on');

    // The EdgeAt function finds the leading edge's height at one point for a moment in time
    // Each drip is a finger with straight sides and a round end; a soft maximum blends it into the sheet above
    function EdgeAt(X, T, Scale)
    {
      const Base = Height * (-0.15 + 1.3 * EaseInOut(T));
      const Soft = 16;
      let Sum = 1;
      Drips.forEach(function (Drip)
      {
        const Half = Drip.W * Scale;
        const Offset = Math.abs(X - Drip.C);
        if (Offset >= Half)
        {
          return;
        }
        const Reach = Drip.Len * Height * EaseOut(Clamp((T - Drip.Delay) / 0.5));
        if (Reach <= 0)
        {
          return;
        }
        const Tip = Math.max(0, Reach - Half) + Math.sqrt(Half * Half - Offset * Offset) * Math.min(1, Reach / Half);
        Sum += Math.exp(Tip / Soft);
      });
      return Base + Soft * Math.log(Sum);
    }

    // The Shape function writes the liquid's outline for a moment in time
    function Shape(T, Scale)
    {
      const Points = [];
      for (let Index = 0; Index <= Steps; Index += 1)
      {
        const X = Index / Steps * Width;
        Points.push(X.toFixed(1) + ' ' + EdgeAt(X, T, Scale).toFixed(1));
      }
      if (Mode === 'pour')
      {
        // Liquid above the edge, hanging down in drips
        return 'M0 -2 L' + Width + ' -2 L' + Points.reverse().join(' L') + ' Z';
      }
      // Liquid below the edge, with the new page pouring down into it
      return 'M0 ' + (Height + 2) + ' L' + Points.join(' L') + ' L' + Width + ' ' + (Height + 2) + ' Z';
    }

    // The Frame function draws one frame
    function Frame(Now)
    {
      const T = Clamp((Now - Started) / Duration);
      const Base = Height * (-0.15 + 1.3 * EaseInOut(T));
      const Drops = [];
      const Shines = [];

      if (Mode === 'pour')
      {
        // Light rim leads the drips, the main water follows just behind
        Kit.Parts.Rim.setAttribute('d', Shape(Clamp(T + 0.015), 1.1));
        Kit.Parts.Liquid.setAttribute('d', Shape(T, 1));
        Drips.forEach(function (Drip)
        {
          const Grow = EaseOut(Clamp((T - Drip.Delay) / 0.5));
          const Tip = Base + Math.max(Drip.Len * Height * Grow, 0);
          if (Grow > 0.15 && Tip < Height)
          {
            Drops.push({ X: Drip.C, Y: Tip + Drip.W * 0.9 + Grow * Height * 0.12, R: Drip.W * 0.38 });
          }
          if (Drip.Len * Height * Grow > Drip.W)
          {
            Shines.push({ X: Drip.C - Drip.W * 0.4, Y: Tip - Drip.W * 0.75, R: Drip.W * 0.14 });
          }
        });
        Kit.Float.style.opacity = Clamp((T - 0.6) / 0.3);
      }
      else
      {
        Kit.Parts.Rim.setAttribute('d', Shape(T, 1));
        Kit.Parts.Liquid.setAttribute('d', Shape(Clamp(T + 0.015), 1.1));
        // Drops of water left behind between the drips, falling slower than the page pours
        Drips.forEach(function (Drip, Index)
        {
          const Next = Drips[Index + 1];
          if (!Next)
          {
            return;
          }
          const Gap = (Drip.C + Drip.W + Next.C - Next.W) / 2;
          const From = 0.5 + Drip.Delay * 0.8;
          if (T > From)
          {
            const Life = (T - From) / 0.45;
            const Start = Height * (-0.15 + 1.3 * EaseInOut(From));
            Drops.push({ X: Gap, Y: Start + (T - From) * Height * 0.75, R: Drip.W * 0.3 * (1 - Life) });
          }
        });
        Kit.Float.style.opacity = 1 - Clamp(T / 0.25);
      }

      Circles(Kit.Parts.Drops, Drops);
      Circles(Kit.Parts.Shine, Shines);

      if (T < 1)
      {
        requestAnimationFrame(Frame);
      }
      else if (Done)
      {
        Done();
      }
    }

    Frame(Started);
    requestAnimationFrame(Frame);
  }

  // The InitWash function pours water over the screen before moving to another page, and lets the next page pour in over it
  function InitWash()
  {
    const Root = document.documentElement;
    const Kit = ReducedMotion() ? null : BuildWash();

    // Arriving under water: swap the plain cover for the liquid, then let the page pour in
    if (Root.classList.contains('wash-cover'))
    {
      if (Kit)
      {
        Kit.Float.style.opacity = 1;
        PlayWash(Kit, 'clear', 1100, function () { Kit.Wash.classList.remove('is-on'); });
        Root.classList.remove('wash-cover');
      }
      else
      {
        Root.classList.remove('wash-cover');
      }
    }

    // Coming back with the browser's back button shows the page as it was left
    window.addEventListener('pageshow', function (Event)
    {
      if (Event.persisted)
      {
        Root.classList.remove('wash-cover');
        if (Kit)
        {
          Kit.Wash.classList.remove('is-on');
        }
      }
    });

    if (!Kit)
    {
      return;
    }

    let Leaving = false;

    document.addEventListener('click', function (Event)
    {
      const Link = Event.target.closest('a[href]');
      if (Leaving || !Link || Event.defaultPrevented || Event.button !== 0 || Event.metaKey || Event.ctrlKey || Event.shiftKey || Event.altKey)
      {
        return;
      }
      if (Link.target === '_blank' || Link.hasAttribute('download'))
      {
        return;
      }

      const Next = new URL(Link.href, window.location.href);
      const Here = new URL(window.location.href);
      if (Next.protocol !== Here.protocol || Next.host !== Here.host || !/\.html?$|\/$/.test(Next.pathname))
      {
        return;
      }
      // Same page with only a #section: let the smooth scroll handle it
      if (Next.pathname === Here.pathname && Next.search === Here.search)
      {
        return;
      }

      Event.preventDefault();
      Leaving = true;
      try { sessionStorage.setItem('or66-wash', 'yes'); } catch (Error) {}
      PlayWash(Kit, 'pour', 950, function () { window.location.href = Next.href; });
    });
  }


  // Section: Water bands

  // The InitBands function draws each water band as flowing cartoon water:
  // a rolling surface on top, and drips underneath that sway, swell and let drops go
  function InitBands()
  {
    const Bands = FindAll('.band').map(function (Band)
    {
      const Top = SvgMake('svg', { class: 'band-edge band-edge--top', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
      const TopRim = SvgMake('path', { class: 'rim-stroke' });
      const TopLiquid = SvgMake('path', { class: 'liquid' });
      Top.append(TopLiquid, TopRim);

      const Bottom = SvgMake('svg', { class: 'band-edge band-edge--bottom', preserveAspectRatio: 'none', 'aria-hidden': 'true' });
      // The outline is clipped so it never shows along the band's own bottom edge
      const ClipId = 'band-clip-' + Math.random().toString(36).slice(2, 8);
      const Clip = SvgMake('clipPath', { id: ClipId });
      const ClipBox = SvgMake('rect', { x: -40, y: -2, width: 99999, height: 2000 });
      Clip.append(ClipBox);
      const Defs = SvgMake('defs');
      Defs.append(Clip);
      Bottom.append(Defs);
      const BottomRim = SvgMake('path', { class: 'rim-line', 'clip-path': 'url(#' + ClipId + ')' });
      const BottomLiquid = SvgMake('path', { class: 'liquid' });
      const DropRim = SvgMake('g', { class: 'rim-line' });
      const Drops = SvgMake('g', { class: 'liquid' });
      const Shine = SvgMake('g', { class: 'shine' });
      Bottom.append(BottomRim, DropRim, BottomLiquid, Drops, Shine);

      Band.prepend(Top);
      Band.append(Bottom);
      return {
        Band: Band, Top: Top, TopRim: TopRim, TopLiquid: TopLiquid,
        Bottom: Bottom, BottomRim: BottomRim, BottomLiquid: BottomLiquid, DropRim: DropRim, Drops: Drops, Shine: Shine,
        Drips: [], Width: 0, Visible: true, Seeds: [Math.random() * 6, Math.random() * 6, Math.random() * 6, Math.random() * 6]
      };
    });

    if (!Bands.length)
    {
      return;
    }

    // The Surface function is a slow rolling wave made of a few overlapping swells
    function Surface(X, Width, Time, Seeds, Size)
    {
      const T = X / Width * Math.PI * 2;
      return Size * (0.55 * Math.sin(T * 2 + Seeds[0] + Time * 0.00035)
        + 0.3 * Math.sin(T * 5 - Seeds[1] - Time * 0.0006)
        + 0.15 * Math.sin(T * 9 + Seeds[2] + Time * 0.0009));
    }

    // The Layout function scatters new drips when the band's width changes: clustered, all different sizes
    function Layout(Item)
    {
      const Width = Item.Band.clientWidth;
      if (Width === Item.Width)
      {
        return;
      }
      Item.Width = Width;
      Item.Drips = [];
      let X = 20 + Math.random() * 60;
      while (X < Width - 20)
      {
        const Big = Math.random() < 0.35;
        Item.Drips.push({
          C: X,
          Neck: Big ? 10 + Math.random() * 8 : 5 + Math.random() * 6,
          Len: Big ? 90 + Math.random() * 120 : 25 + Math.random() * 60,
          Period: 2600 + Math.random() * 3400,
          Phase: Math.random(),
          Seed: Math.random() * 6.28
        });
        // Drips bunch up in places and leave gaps in others, like real runs
        X += Math.random() < 0.3 ? 120 + Math.random() * 160 : 34 + Math.random() * 60;
      }
      Item.Top.setAttribute('viewBox', '0 0 ' + Width + ' 70');
      Item.Bottom.setAttribute('viewBox', '0 0 ' + Width + ' 260');
    }

    // The DripPath function draws one drip: a soft shoulder, a thin neck and a round swollen end
    function DripPath(C, Start, Length, Neck, Bulb, Sway)
    {
      const Shoulder = Neck * 2.6;
      const End = Start + Length;
      const Tip = C + Sway;
      const Mid = C + Sway * 0.45;
      return 'M' + (C - Shoulder).toFixed(1) + ' ' + (Start - 6).toFixed(1)
        + ' C' + (C - Neck).toFixed(1) + ' ' + (Start - 2).toFixed(1) + ' ' + (Mid - Neck).toFixed(1) + ' ' + (Start + Length * 0.25).toFixed(1) + ' ' + (Mid - Neck * 0.9).toFixed(1) + ' ' + (Start + Length * 0.55).toFixed(1)
        + ' C' + (Tip - Neck * 0.8).toFixed(1) + ' ' + (End - Bulb * 1.6).toFixed(1) + ' ' + (Tip - Bulb).toFixed(1) + ' ' + (End - Bulb * 1.3).toFixed(1) + ' ' + (Tip - Bulb).toFixed(1) + ' ' + (End - Bulb * 0.4).toFixed(1)
        + ' A' + Bulb.toFixed(1) + ' ' + Bulb.toFixed(1) + ' 0 0 0 ' + (Tip + Bulb).toFixed(1) + ' ' + (End - Bulb * 0.4).toFixed(1)
        + ' C' + (Tip + Bulb).toFixed(1) + ' ' + (End - Bulb * 1.3).toFixed(1) + ' ' + (Tip + Neck * 0.8).toFixed(1) + ' ' + (End - Bulb * 1.6).toFixed(1) + ' ' + (Mid + Neck * 0.9).toFixed(1) + ' ' + (Start + Length * 0.55).toFixed(1)
        + ' C' + (Mid + Neck).toFixed(1) + ' ' + (Start + Length * 0.25).toFixed(1) + ' ' + (C + Neck).toFixed(1) + ' ' + (Start - 2).toFixed(1) + ' ' + (C + Shoulder).toFixed(1) + ' ' + (Start - 6).toFixed(1)
        + ' Z';
    }

    // The Draw function moves the surface and drips for this moment and scroll position
    function Draw(Item, Time)
    {
      const Still = ReducedMotion();
      const Now = Still ? 0 : Time;
      const Box = Item.Band.getBoundingClientRect();
      const View = window.innerHeight;
      // Drips grow longer as the band's bottom rises up the screen
      const Stretch = Still ? 0.8 : 0.45 + 0.55 * EaseOut(Clamp((View - Box.bottom) / (View * 0.6)));
      // Scrolling nudges the water sideways so it feels like it is flowing
      const Flow = Still ? 0 : -Box.top * 1.2;
      const Width = Item.Width;
      const Steps = Math.ceil(Width / 6);

      // Rolling surface on top
      const Top = [];
      for (let Index = 0; Index <= Steps; Index += 1)
      {
        const X = Index / Steps * Width;
        Top.push(X.toFixed(1) + ' ' + (36 + Surface(X, Width, Now + Flow, Item.Seeds, 20)).toFixed(1));
      }
      const TopD = 'M-10 72 L-10 ' + Top[0].split(' ')[1] + ' L' + Top.join(' L') + ' L' + (Width + 10) + ' 72 Z';
      Item.TopRim.setAttribute('d', 'M-10 ' + Top[0].split(' ')[1] + ' L' + Top.join(' L') + ' L' + (Width + 10) + ' ' + Top[Top.length - 1].split(' ')[1]);
      Item.TopLiquid.setAttribute('d', TopD);

      // Wavy underside the drips hang from
      // The Under function is the underside's height at one point
      function Under(X)
      {
        return 14 + Surface(X, Width, Now * 0.8 - Flow, [Item.Seeds[3], Item.Seeds[1], Item.Seeds[0]], 12);
      }
      // Drawn in the same turning direction as the drips, so where they overlap they join instead of cancelling out
      const Bottom = [];
      for (let Index = 0; Index <= Steps; Index += 1)
      {
        const X = Index / Steps * Width;
        Bottom.push(X.toFixed(1) + ' ' + Under(X).toFixed(1));
      }
      let D = 'M-10 -2 L-10 ' + Under(0).toFixed(1) + ' L' + Bottom.join(' L') + ' L' + (Width + 10) + ' ' + Under(Width).toFixed(1) + ' L' + (Width + 10) + ' -2 Z';

      const Falling = [];
      const Shines = [];
      Item.Drips.forEach(function (Drip)
      {
        // Each drip slowly swells, lets a drop go, and pulls back
        const Cycle = Still ? 0.3 : ((Now / Drip.Period + Drip.Phase) % 1);
        const Swell = Cycle < 0.7 ? EaseInOut(Cycle / 0.7) : 1 - EaseOut((Cycle - 0.7) / 0.12 > 1 ? 1 : (Cycle - 0.7) / 0.12);
        const Length = Drip.Len * Stretch + Swell * 22;
        const Bulb = Drip.Neck * (1.35 + Swell * 0.5);
        const Sway = Still ? 0 : Math.sin(Now / 900 + Drip.Seed) * Drip.Neck * 0.6;
        const Start = Under(Drip.C);
        D += ' ' + DripPath(Drip.C, Start, Length, Drip.Neck, Bulb, Sway);

        const TipY = Start + Length;
        Shines.push({ X: Drip.C + Sway - Bulb * 0.38, Y: TipY - Bulb * 0.75, R: Bulb * 0.22 });

        // The drop that just broke off falls and shrinks
        if (!Still && Cycle >= 0.7)
        {
          const Fall = (Cycle - 0.7) / 0.3;
          Falling.push({ X: Drip.C + Sway, Y: TipY + Bulb + Fall * Fall * 120, R: Bulb * 0.95 * (1 - Fall * 0.8) });
        }
      });

      Item.BottomRim.setAttribute('d', D);
      Item.BottomLiquid.setAttribute('d', D);
      Circles(Item.DropRim, Falling);
      Circles(Item.Drops, Falling);
      Circles(Item.Shine, Shines);
    }

    Bands.forEach(function (Item) { Layout(Item); Draw(Item, 0); });
    window.addEventListener('resize', function () { Bands.forEach(function (Item) { Layout(Item); Draw(Item, performance.now()); }); });

    if (ReducedMotion())
    {
      return;
    }

    // Only animate bands that are on screen
    if ('IntersectionObserver' in window)
    {
      const Watch = new IntersectionObserver(function (Entries)
      {
        Entries.forEach(function (Entry)
        {
          const Item = Bands.find(function (Each) { return Each.Band === Entry.target; });
          if (Item)
          {
            Item.Visible = Entry.isIntersecting;
          }
        });
      }, { rootMargin: '300px 0px' });
      Bands.forEach(function (Item) { Watch.observe(Item.Band); });
    }

    // The Tick function keeps the water moving while a band is in view
    function Tick(Time)
    {
      Bands.forEach(function (Item)
      {
        if (Item.Visible)
        {
          Draw(Item, Time);
        }
      });
      requestAnimationFrame(Tick);
    }
    requestAnimationFrame(Tick);
  }


  // Section: Start
  InitWash();
  InitBands();
  InitPhotos();
  InitDuotone();
  InitNav();
  InitTrip();
  InitHours();
  InitWashCards();
  InitRoute();
  InitBuilder();
  InitGallery();
  InitMap();
  InitMotion();
})();

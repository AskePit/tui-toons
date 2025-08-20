setTuiMode(TuiMode.TEXT)

const Loc =
{
    cpu1 : {
        cache : {
            TL: 1324,
        },
        read : {
            TL: 744,
        },
        write : {
            TL: 1944,
        },
        code : {
            TL: 3364,
        },
    },
    cpu2 : {
        cache : {
            TL: 1422,
        },
        read : {
            TL: 802,
        },
        write : {
            TL: 2002,
        },
        code : {
            TL: 3442,
        },
    },
    memory : {
        TL: 769,
    }
}


let screen =
`                                        ┌──────────────────────────────────────────┐                                   
                                        │                                          │                                   
                                        │                                          │                                   
                      ┌──────────────┐  │  /  ┌────────────────────────┐  /     ┌──▼───────────┐                       
                      │ Read buffer  │  │  /  │         Memory         │  /     │ Read buffer  │                       
                      ├──────────────┤  │  /  ├────────────────────────┤  /     ├──────────────┤                       
                      │              │  │  /  │  x                  5  │  /     │              │                       
                      │              │  │  /  │  flag               1  │  /     │              │                       
  ┌──────────────┐    │              │  │  /  │  reset             14  │  /     │              │    ┌──────────────┐   
  │     CPU1     │◄───┤              │  │  /  │  r                  8  │  /     │              ├───►│     CPU2     │   
  ├──────────────┤    │              │  │  /  │  zzz               15  │  /     │              │    ├──────────────┤   
  │ x          5 │    └──────────────┘  │  /  │                        │  /     └──────────────┘    │              │   
  │ flag       1 │                      │  /  │                        │  /                         │              │   
  │ reset     14 │    ┌──────────────┐  │  /  │                        │  /     ┌──────────────┐    │              │   
  │ r          8 ├───►│ Store buffer │  │  /  │                        │  /     │ Store buffer │◄───┤              │   
  │ zzz       15 │    ├──────────────┤  │  /  │                        │  /     ├──────────────┤    │              │   
  └──────────────┘    │              │  │  /  │                        │  /     │              │    └──────────────┘   
                      │              ├──┘  /  │                        │  /     │              │                       
                      │              │     /  │                        │  /     │              │                       
                      │              │     /  │                        │  /     │              │                       
                      │              │     /  │                        │  /     │              │                       
                      └──────────────┘     /  └────────────────────────┘  /     └──────────────┘                       
                                           /                              /                                            
                                           /                              /                                            
  ┌──────────────────────────────────┐     /                              /     ┌──────────────────────────────────┐   
  │           Instructions           │     /                              /     │           Instructions           │   
  ├──────────────────────────────────┤     /                              /     ├──────────────────────────────────┤   
  │                                  │     /                              /     │                                  │   
> │ data = 42                        │     /                              /     │ r1 = flag acquire                │ < 
  │ flag = 1 release                 │     /                              /     │ r2 = data                        │   
  │                                  │     /                              /     │                                  │   
  │                                  │     /                              /     │                                  │   
  │                                  │     /                              /     │                                  │   
  │                                  │     /                              /     │                                  │   
  │                                  │     /                              /     │                                  │   
  │                                  │     /                              /     │                                  │   
  │                                  │     /                              /     │                                  │   
  │                                  │     /                              /     │                                  │   
  │                                  │     /                              /     │                                  │   
  │                                  │     /                              /     │                                  │   
  └──────────────────────────────────┘     /                              /     └──────────────────────────────────┘   
                                           /                              /                                            
                                           /                              /                                            
                                           /                              /                                            
`;

function setCharAt(str, index, chr) {
  if (index < 0 || index >= str.length) return str; // out of range
  return str.substring(0, index) + chr + str.substring(index + 1);
}

for (const cpu of [Loc.cpu1, Loc.cpu2]) {
    for (const obj of [cpu.cache, cpu.read, cpu.write, cpu.code]) {
        screen = setCharAt(screen, obj.TL, '@')
    }
    screen = setCharAt(screen, Loc.memory.TL, '@')
}

tui.textContent = screen
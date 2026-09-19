import math, random
from PIL import Image, ImageFilter
S3=math.sqrt(3); rng=random.Random(9)
NW,NH=256,254; K=2
def hexmask(cx,cy,R):
    m=set()
    for y in range(int(cy-R-2),int(cy+R+3)):
        for x in range(int(cx-R-2),int(cx+R+3)):
            dx=abs(x+.5-cx); dy=abs(y+.5-cy)
            if dx<=R*S3/2 and dy<=R-dx/S3 and not(dy>R*0.86 and dx>R*0.18):  # chamfer tips
                m.add((x,y))
    return m
def isedge(m,q):
    x,y=q; return not((x-1,y) in m and (x+1,y) in m and (x,y-1) in m and (x,y+1) in m)
def mix(a,b,t): return tuple(int(x*(1-t)+y*t) for x,y in zip(a,b))
def dim(c,f): return tuple(max(0,min(255,int(v*f))) for v in c)
FAM={
 "navy":  dict(ft=(30,40,104), fb=(14,19,58),  rim=(84,128,228), rim2=(40,58,130), st=(40,54,124), sl=(10,13,40),  sp=(130,180,255), crack=(70,150,230)),
 "violet":dict(ft=(60,36,126), fb=(30,18,78),  rim=(188,108,238),rim2=(96,52,160), st=(78,48,150), sl=(22,12,54),  sp=(210,170,255), crack=(170,110,240)),
 "ice":   dict(ft=(186,236,255),fb=(112,188,250),rim=(230,248,255),rim2=(150,210,255),st=(90,150,220),sl=(40,70,150),sp=(255,255,255),crack=(255,255,255)),
 "blue":  dict(ft=(100,150,248),fb=(58,98,220), rim=(160,206,255),rim2=(96,140,240),st=(60,90,190), sl=(26,40,110), sp=(230,242,255),crack=(200,230,255)),
 "lav":   dict(ft=(156,116,244),fb=(118,80,222),rim=(214,176,255),rim2=(150,110,240),st=(96,66,180),sl=(44,28,100), sp=(245,235,255),crack=(230,210,255)),
 "pink":  dict(ft=(236,128,224),fb=(196,88,200),rim=(255,186,246),rim2=(220,120,220),st=(140,60,160),sl=(70,24,90),  sp=(255,235,252),crack=(255,220,250)),
}
EX,EY=-0.5,-0.62   # extrusion direction (back = up-left)
def draw_prism(img,cx,cy,R,fam,f=1.0,depth=4,rr=rng,lit=False,face_only=False,crack=False,stars=1):
    p=FAM[fam]; px=img.load(); W,H=img.size
    front=hexmask(cx,cy,R)
    if not face_only:
        band={}
        for t in range(depth,0,-1):
            bm=hexmask(cx+EX*t,cy+EY*t,R)
            for q in bm:
                if q in front: continue
                band[q]=t
        backm=hexmask(cx+EX*depth,cy+EY*depth,R)
        for q,t in band.items():
            if not(0<=q[0]<W and 0<=q[1]<H): continue
            ang=math.degrees(math.atan2(q[1]+.5-cy,q[0]+.5-cx))
            c=p["st"] if -150<ang<-25 else p["sl"]
            if q in backm and isedge(backm,q): c=mix(c,p["rim2"],.55)   # far edge line
            px[q]=dim(c,f)+(255,)
    for q in front:
        if not(0<=q[0]<W and 0<=q[1]<H): continue
        t=(q[1]-(cy-R))/(2*R)
        c=mix(p["ft"],p["fb"],max(0,min(1,t)))
        if rr.random()<.18: c=dim(c,1.08)
        if lit:
            d=math.hypot(q[0]+.5-cx,q[1]+.5-cy)/R
            c=mix(c,p["rim"],max(0,.45-d)*1.1)
        if isedge(front,q):
            ang=math.degrees(math.atan2(q[1]+.5-cy,q[0]+.5-cx))
            c=p["rim"] if (ang<-20 or ang>150) else p["rim2"]
        px[q]=dim(c,f)+(255,)
    inner=[q for q in front if all(((q[0]+a,q[1]+b) in front) for a in(-2,2) for b in(-2,2)) and 0<=q[0]<W and 0<=q[1]<H]
    if crack and inner:
        x,y=rr.choice(inner)
        for i in range(rr.randint(3,6)):
            if (x,y) in front: px[x,y]=dim(p["crack"],f*.9)+(255,)
            y+=1; x+=rr.choice([0,0,1,-1])
    for q in rr.sample(inner,min(stars,len(inner))): px[q]=dim(p["sp"],f)+(255,)
    return front
CX,CY=128,100
def shape(x,y,grow=0.0):
    u=(x-CX)/110; v=(y-CY)/80
    a=math.atan2(v,u); r=math.hypot(u,v)
    b=1+grow+0.05*math.sin(4*a+2.2)+0.04*math.sin(9*a+.7)+0.03*math.sin(14*a+1.9)
    top = r<b and v<0.50+0.07*math.sin(u*5+1)+(0.08 if u>-0.3 else 0.0)+grow
    low = ((u-0.06)/(0.70+grow))**2+((v-0.52)/(0.40+grow))**2<1
    sc=CX+14+4*math.sin((y-150)/14)
    hw=max(13, 26-(y-160)*0.2)+grow*26
    stem=160<y<240 and abs(x-sc)<hw
    return (top or low), stem, (b-r)
R0=8.6
def lattice(ox,oy,sp):
    dx=R0*S3*sp; dy=R0*1.5*sp
    return [(ox+c*dx+(dx/2 if r%2 else 0)+rng.uniform(-.8,.8), oy+r*dy+rng.uniform(-.8,.8)) for r in range(-2,24) for c in range(-2,22)]
cells=[]   # (z, x, y, R, fam, depth, f)
for z,(ox,oy,grow,dens) in enumerate([(4,4,0.0,1.0),(-1,-1,0.0,0.85),(-6,-6,-0.02,0.0)]):
    for x,y in lattice(ox,oy,1.05):
        inb,stem,edge=shape(x,y,grow)
        if not(inb or stem): continue
        if z==2:
            pr = 0.95 if stem else min(0.95,0.45+edge*3)
        elif z==1:
            pr = 0.8 if stem else 0.75
        else: pr=1.0
        if rng.random()>pr: continue
        u=(x-CX)/110; v=(y-CY)/80
        # sphere shading: brighter center-top, darker edge/bottom
        shade = 0.55+0.45*max(0,min(1,edge*2.2)) if not stem else max(0.45,0.9-(y-160)/140)
        zf=[0.3,0.62,1.0][z]
        vio_p = 0.35 + 0.35*max(0,0.25-edge)*4 + (0.25 if stem else 0) + 0.15*u
        fam="violet" if rng.random()<vio_p else "navy"
        zz=z; xx=x; yy=y; ff=zf*shade
        if z==2 and not stem and rng.random()<0.22: zz=1.5; xx-=3; yy-=3; ff*=0.68
        cells.append(dict(z=zz,x=xx,y=yy,R=R0*rng.uniform(.93,1.06),fam=fam,depth=rng.choice([4,5,6,6,7,8]),f=ff,stem=stem))
print(len(cells), sum(c['z']==2 for c in cells))
front=[c for c in cells if c['z']==2 and c['f']>0.6 and not c['stem']]
rng.shuffle(front)
litn=0
for c in front[:26]:
    c['fam']=["ice","ice","blue","blue","lav","lav","lav","pink"][litn%8]; c['lit']=True; c['group']=litn%4; litn+=1
node=min([c for c in cells if c['z']==2 and not c.get('lit')],key=lambda c:(c['x']-96)**2+(c['y']-62)**2); node['node']=True
idle_front=[c for c in cells if c['z']==2 and not c.get('lit') and not c.get('node')]
for c in rng.sample(idle_front,min(30,len(idle_front))): c['wave']=True
ghosts=[]
for _ in range(9):
    for _t in range(50):
        x=rng.uniform(10,246); y=rng.uniform(10,244)
        inb,stem,edge=shape(x,y,0.12)
        inb2,stem2,_=shape(x,y,0.0)
        if (inb or stem) and not (inb2 or stem2): ghosts.append((x,y)); break
for y in range(200,250,22): ghosts.append((CX+14+rng.uniform(-30,30),y))
def order(c): return (c['z'], c['y']+c['x']*0.35)
def render(which):
    im=Image.new("RGBA",(NW,NH),(0,0,0,0))
    if which=="base":
        pxs=im.load()
        for gx,gy in ghosts:
            m=hexmask(gx,gy,R0)
            for q in m:
                if 0<=q[0]<NW and 0<=q[1]<NH and isedge(m,q): pxs[q]=(26,26,66,255)
    for c in sorted(cells,key=order):
        rr=random.Random(int(c['x']*131+c['y']*17+c['z']))
        if which=="base":
            fam=c['fam']; f=c['f']
            if c.get('lit'): f=f*0.7
            draw_prism(im,c['x'],c['y'],c['R'],fam,f=f,depth=c['depth'],rr=rr,lit=c.get('lit',False),crack=rr.random()<.22,stars=rr.choice([0,1,1,2]))
            if c.get('node'):
                m=hexmask(c['x'],c['y'],c['R']); p=im.load()
                for q in m:
                    if 0<=q[0]<NW and 0<=q[1]<NH:
                        p[q]=(214,250,120,255) if isedge(m,q) else mix((60,110,90),(40,80,70),(q[1]-c['y']+c['R'])/(2*c['R']))+(255,)
                m2=hexmask(c['x'],c['y'],c['R']-2)
                for q in m2:
                    if isedge(m2,q): p[q]=(120,170,90,255)
        elif which.startswith("g") and c.get('lit') and c['group']==int(which[1]):
            draw_prism(im,c['x'],c['y'],c['R'],c['fam'],f=1.0,rr=rr,lit=True,face_only=True,stars=2)
        elif which=="wave" and c.get('wave'):
            draw_prism(im,c['x'],c['y'],c['R'],"navy",f=c['f']*1.25,rr=rr,face_only=True,stars=1,crack=True)
    return im
def up(im): return im.resize((im.width*K,im.height*K),Image.NEAREST)
def glow(sharp,blur,strength,keep=True):
    h=sharp.filter(ImageFilter.GaussianBlur(blur)); h.putalpha(h.split()[3].point(lambda v:int(min(255,v*strength))))
    o=Image.new("RGBA",sharp.size,(0,0,0,0)); o.alpha_composite(h)
    if keep: o.alpha_composite(sharp)
    return o
B=up(render("base"))
# haze + static lit glow
haze=Image.new("RGBA",(NW,NH),(0,0,0,0)); hp=haze.load()
for c in cells:
    if c['z']==2:
        for q in hexmask(c['x'],c['y'],c['R']):
            if 0<=q[0]<NW and 0<=q[1]<NH: hp[q]=(60,34,130,45)
litl=Image.new("RGBA",(NW,NH),(0,0,0,0))
for c in cells:
    if c.get('lit'): draw_prism(litl,c['x'],c['y'],c['R'],c['fam'],f=.8,face_only=True,lit=True)
base=Image.new("RGBA",B.size,(0,0,0,0))
base.alpha_composite(glow(up(haze),22,1.0,keep=False))
base.alpha_composite(glow(up(litl),12,.55,keep=False))
base.alpha_composite(B)
layers=[base]
for g in range(4): layers.append(glow(up(render(f"g{g}")),12,1.4))
layers.append(glow(up(render("wave")),5,.5))
nd=Image.new("RGBA",(NW,NH),(0,0,0,0)); p=nd.load(); m=hexmask(node['x'],node['y'],node['R']+1.6)
for q in m:
    if isedge(m,q): p[q]=(214,250,120,255)
layers.append(glow(up(nd),7,1.8))
for s in range(2):
    sp=Image.new("RGBA",(NW,NH),(0,0,0,0)); p=sp.load(); rr=random.Random(40+s)
    for c in rr.sample([c for c in cells if c['z']==2],40):
        x=max(1,min(NW-2,int(c['x']+rr.uniform(-4,4)))); y=max(1,min(NH-2,int(c['y']+rr.uniform(-4,4))))
        col=(240,244,255,255) if rr.random()<.6 else (210,180,255,255); p[x,y]=col
        if rr.random()<.3:
            for a,b in((1,0),(-1,0),(0,1),(0,-1)): p[x+a,y+b]=col[:3]+(140,)
    layers.append(glow(up(sp),3,1.6))
W,H=B.size
sprite=Image.new("RGBA",(W,H*len(layers)),(0,0,0,0))
for i,l in enumerate(layers): sprite.alpha_composite(l,(0,H*i))
sprite.save("sprite_brain4.png")
prev=Image.new("RGBA",(W,H),(6,7,20,255))
for l in layers: prev.alpha_composite(l)
prev.save("b4_preview.png"); print("ok",W,H,len(layers))
